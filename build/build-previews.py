#!/usr/bin/env python3
"""Rebuild data/automations-data.js from the real email files and the WhatsApp template file.

The previews have to show the exact HTML that gets loaded into GHL, so they read the files
in emails/ rather than carrying their own copy that can drift. Run this after editing
anything in emails/ or data/whatsapp-templates.json:

    python build/build-previews.py

It can be run from anywhere: every path below is resolved from PACK, the pack root, not
from the working directory.

Merge fields are filled with sample data for the preview only. The files on disk keep the
real {{merge_field}} tokens, which is what gets pasted into GHL.

TWO pages consume the output now, not one, so a change here shows up in both:
  automations/automations.html      = EMAILS + WA, every node's preview and phone frame
  mapping-result/mapping-result.html = EMAILS.journal, the mapping email in a phone
Only these fourteen emails and eight templates are generated. The mockup pages themselves are
hand-written and are not built by this script; nothing here needs to know about them.
"""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))   # build/
PACK = os.path.dirname(HERE)                        # the pack root

# Meta's hard limits on a WhatsApp message template. Enforced at SUBMISSION: break one and the
# template is rejected outright, which leaves the workflow step with nothing to send. The
# build fails rather than emitting a template that cannot be submitted.
WA_BODY_LIMIT = 1024      # body text
WA_BUTTON_LIMIT = 25      # each quick-reply label
WA_MAX_BUTTONS = 3        # quick-reply buttons per template

# preview key -> file in emails/. The key is what a workflow node references.
EMAIL_FILES = [
    # The announcement blast. Added 17 Aug: it existed in emails/ for days and was referenced
    # by nothing, so the workflow map could not say who received it. It is the only asset here
    # that goes to a hand-built list rather than to a workflow-held contact.
    ("blast",    "beauty-voucher-email-blast.html"),
    ("nurture1", "nurture-1-you-never-skip-your-hair.html"),
    ("nurture2", "nurture-2-keep-putting-off.html"),
    ("nurture3", "nurture-3-three-tiers-plainly.html"),
    ("nurture4", "nurture-4-four-days-left.html"),
    ("nurture5", "nurture-5-final-day.html"),
    ("welcome1", "welcome-1-confirmation.html"),
    ("welcome2", "welcome-2-what-your-credit-covers.html"),
    ("welcome3", "welcome-3-confidence-mapping.html"),
    ("expiry",   "welcome-4-expiry-touch.html"),
    ("journal",  "mapping-1-journal.html"),
    ("bridge",   "mapping-2-bridge.html"),
    ("chair",    "mapping-3-chair.html"),
    ("tiers",    "mapping-4-tiers.html"),
]

# A real, live URL so every link and button in the preview is actually clickable. GHL
# replaces {{unsubscribe_link}} with its own hosted preference-centre URL at send time.
LIVE = "https://tararosesalon.com"

SAMPLE = {
    "{{contact.first_name}}": "Layla",
    "{{contact.route}}": "Colour correction",
    "{{contact.top_pain}}": "Brassy tones, and it never lasts",
    "{{credit_remaining}}": "1,850",
    "{{expiry_date}}": "12 May 2027",
    "{{bonus_amount}}": "500",
    "{{voucher_availability_line}}":
        "Available at our Abu Dhabi salons, Mamsha al Saadiyat and Khalifa City A.",
    "{{unsubscribe_link}}": LIVE,
    "{{booking_url}}": LIVE,
    "{{voucher_url}}": LIVE,
    "{{voucher_hold_url}}": LIVE,
    "{{confidence_map_url}}": LIVE,
    "{{mapping_url}}": LIVE,
    # the branch-choice buttons in the confirmation email
    "{{branch_a_name}}": "Mamsha al Saadiyat",
    "{{branch_b_name}}": "Khalifa City A",
    "{{branch_a_url}}": LIVE,
    "{{branch_b_url}}": LIVE,
    "{{help_me_choose_url}}": LIVE,
    # The logo. Both pages that render these previews sit one folder deep, so one
    # relative path serves both. At send time this is the GHL-hosted white logo.
    "{{LOGO_URL}}": "../assets/tara-rose-logo-white.png",
    # The three blast photos, chosen 18 Aug and cut to the slot specs. Same relative
    # path logic as the logo: both consuming pages sit one folder deep.
    "{{HERO_IMAGE_URL}}": "../assets/blast-hero.jpg",
    "{{IMAGE_2_URL}}": "../assets/blast-square-2.jpg",
    "{{IMAGE_3_URL}}": "../assets/blast-square-3.jpg",
}


def fill(html):
    for token, value in SAMPLE.items():
        html = html.replace(token, value)
    left = sorted(set(re.findall(r"\{\{[^}]+\}\}", html)))
    return html, left


def main():
    emails, unfilled = {}, {}
    for key, name in EMAIL_FILES:
        path = os.path.join(PACK, "emails", name)
        with open(path, encoding="utf-8") as fh:
            html, left = fill(fh.read())
        emails[key] = html
        if left:
            unfilled[name] = left

    with open(os.path.join(PACK, "data", "whatsapp-templates.json"), encoding="utf-8") as fh:
        wa_json = json.load(fh)
    wa_src = wa_json["templates"]

    # [voucher link] is resolved to the real URL BEFORE anything is counted. Meta counts the
    # literal characters of a static URL in the body, so a template carrying a 14-character
    # placeholder reports a character count the submitted message will never have. Defined
    # once in the "links" block of whatsapp-templates.json: change it there and every count,
    # every preview and every copy-to-clipboard follows.
    links = wa_json.get("links") or {}

    def resolve(text):
        for token, url in links.items():
            text = text.replace("[%s]" % token, url)
        return text

    wa, problems = {}, []
    for key, tpl in wa_src.items():
        for field in ("label", "region", "submit"):
            if not tpl.get(field):
                problems.append('%s: missing "%s"' % (key, field))
        submit = resolve(tpl.get("submit") or "")
        leftover = re.findall(r"\[[a-z ]+\]", submit.replace("[Name]", ""))
        if leftover:
            problems.append("%s: unresolved placeholder(s) %s, add them to the links block"
                            % (key, ", ".join(sorted(set(leftover)))))

        # Meta rejects an over-length body at SUBMISSION, so the step silently ends up with
        # nothing to send. This is the check that has to be a hard failure.
        if len(submit) > WA_BODY_LIMIT:
            problems.append("%s: submit body is %d chars, limit is %d"
                            % (key, len(submit), WA_BODY_LIMIT))

        buttons = tpl.get("buttons") or []
        if len(buttons) > WA_MAX_BUTTONS:
            problems.append("%s: %d quick-reply buttons, limit is %d"
                            % (key, len(buttons), WA_MAX_BUTTONS))
        for b in buttons:
            if len(b) > WA_BUTTON_LIMIT:
                problems.append('%s: button "%s" is %d chars, limit is %d'
                                % (key, b, len(b), WA_BUTTON_LIMIT))

        entry = {
            "label": tpl["label"],
            "region": tpl["region"],
            "submit": submit,
            "submitChars": len(submit),
        }
        # kept for reference only, and allowed to be over the cap because it never ships
        if tpl.get("longer_draft"):
            longer = resolve(tpl["longer_draft"])
            entry["longer"] = longer
            entry["longerChars"] = len(longer)
        # quick-reply buttons are part of the submitted template, so the phone preview has to
        # show them, they are what the If/Else router branches on
        if buttons:
            entry["buttons"] = buttons
        wa[key] = entry

    # Refuse to write rather than write something that cannot be submitted. Both of these
    # limits were breached at some point and found only by chance; failing the build is what
    # stops that recurring.
    if problems:
        print("REFUSING TO BUILD: %d WhatsApp template problem(s):" % len(problems))
        for msg in problems:
            print("  x %s" % msg)
        print("\nFix data/whatsapp-templates.json and run again. Nothing was written.")
        return 1

    out = os.path.join(PACK, "data", "automations-data.js")
    with open(out, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("/* GENERATED by build-previews.py. Do not edit by hand.\n")
        fh.write("   Source: emails/*.html and data/whatsapp-templates.json.\n")
        fh.write("   Merge fields are filled with sample data for preview only. */\n")
        fh.write("const WA_BODY_LIMIT = %d;\n" % WA_BODY_LIMIT)
        fh.write("const WA_BUTTON_LIMIT = %d;\n" % WA_BUTTON_LIMIT)
        fh.write("const EMAILS = " + json.dumps(emails, ensure_ascii=False) + ";\n")
        fh.write("const WA = " + json.dumps(wa, ensure_ascii=False) + ";\n")

    print("wrote %s" % os.path.relpath(out, PACK))
    print("  %d emails, %d WhatsApp templates" % (len(emails), len(wa)))
    print("  all submit bodies within %d chars, all buttons within %d"
          % (WA_BODY_LIMIT, WA_BUTTON_LIMIT))
    headroom = sorted(((v["submitChars"], k) for k, v in wa.items()), reverse=True)[:3]
    print("  longest: " + ", ".join("%s %d" % (k, n) for n, k in headroom))
    if unfilled:
        print("  merge fields with no sample value (will show raw in the preview):")
        for name, fields in unfilled.items():
            print("    %s: %s" % (name, ", ".join(fields)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
