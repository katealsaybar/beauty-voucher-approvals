// ============================================================
// TARA ROSE — Wellness Voucher cheat sheets, the question widget
// supabase/functions/cheat-sheet-ask/index.ts
// ============================================================
//
// Sibling of pulse-narrative and branch-narrative: same project, same
// ANTHROPIC_API_KEY secret, same house rules. Where those two write English
// about numbers they were handed, this one answers questions about text it was
// handed, and the discipline is the same one: it may not produce a fact it was
// not given.
//
// WHY IT EXISTS: the cheat sheets are static HTML on a public host, so they
// cannot hold an API key. This function holds it and is the only thing that
// talks to Anthropic.
//
// THE ONE DESIGN RULE, and everything below serves it: a cheat sheet exists so
// somebody says the right thing to a client. A confidently wrong answer is
// therefore worse than no answer. So the model is given the sheets as its only
// source, is told to refuse rather than reason, and every answer carries the
// line it came from so a human can check it in two seconds.
//
// THE GROUNDING IS SENT BY THE CALLER, not stored here. The widget reads the
// live text out of the four sheet pages at ask time. So the answers cannot drift
// from the sheets, because there is no second copy to drift from. Edit a sheet
// and the answers change with it.
//
// Deploy:  supabase functions deploy cheat-sheet-ask --project-ref gvijxenafoowajqktqvd
// Secrets: shares pulse-narrative's ANTHROPIC_API_KEY. Nothing new to set.
// Tables:  none. Nothing is stored; a question is not a record.
//
// No em-dashes anywhere in this file, per the 4 July purge. Comments included.

import Anthropic from "npm:@anthropic-ai/sdk";

const MODEL = "claude-opus-5";
const MAX_QUESTION_CHARS = 600;
const MAX_CONTEXT_CHARS = 90000;

// ── VOICE AND DISCIPLINE ────────────────────────────────────
const SYSTEM = `You answer questions from the Tara Rose team about the Wellness Voucher campaign, using the team cheat sheets you are given and nothing else.

Who is asking. Reception at a busy till, the GHL team mid-build, or LID working through a revision list. They need an answer they can act on in seconds, often with a client waiting.

THE RULE THAT OVERRIDES EVERYTHING ELSE: your only source is the SHEETS block. You have no other knowledge of this campaign. Anything you think you remember about Tara Rose, salon vouchers, prices or this offer is not evidence. Prices, allowances, tier rules and dates have changed more than once; the sheets are current and your memory is not. If the sheets do not say it, you do not know it.

How to answer.
1. Answer plainly in one to three sentences, leading with what they should do or say.
2. Quote, as close to word for word as you can, the single sentence from the sheets that carries the answer. One sentence, not a paragraph.
3. If the sheets do not answer it, set found to false, say so in one sentence, and name the owner if the sheets name one. "I do not know, ask Kate" is a correct and useful answer here. Never fill a gap with a plausible number, rule or date.
4. If the question belongs to another team, still answer it if the sheets cover it, and say which sheet it came from.

Never acceptable. Inventing or estimating a price, an allowance, a cap, a validity period or a date. Softening a rule the sheets state firmly. Deciding a specific client's bill or booking, which is a till decision and not yours. Guessing whether a service counts as major colour beyond the named list: if it is not on that list, say it is not on the list and that they should ask before the appointment.

Voice: warm, real, expert, plain. British English. Short sentences, no filler, no preamble, never open with "Great question". No exclamation marks. Never use an em-dash.`;

// ── OUTPUT SHAPE ────────────────────────────────────────────
// Raw json_schema, matching the house pattern in branch-narrative. Structure
// rather than string parsing, so the citation cannot go missing silently and
// the widget always knows whether it got an answer or a refusal.
const SCHEMA = {
  type: "object",
  properties: {
    found: {
      type: "boolean",
      description: "True only if the sheets actually answer the question. False if you are declining or saying you do not know.",
    },
    answer: {
      type: "string",
      description: "One to three sentences, leading with what to do or say. If found is false, one sentence saying so and naming the owner if the sheets name one.",
    },
    source: {
      type: "string",
      description: "The single sentence from the sheets that carries the answer, quoted as closely as you can. If found is false, the exact string: not in the sheets",
    },
    sheet: {
      type: "string",
      description: "Which sheet the answer came from: Overview, LID, GHL team, or Reception. Empty string if found is false.",
    },
  },
  required: ["found", "answer", "source", "sheet"],
  additionalProperties: false,
};

// The sheets are served from a public Pages site. Only that origin plus local
// preview may call this. Not a security boundary on its own, but it stops the
// endpoint being casually reused from anywhere else.
const ALLOWED_ORIGINS = [
  "https://katealsaybar.github.io",
  "https://tararose83.github.io",
  "http://localhost:8791",
  "http://127.0.0.1:8791",
];

function cors(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  };
}

const json = (body: unknown, headers: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "content-type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  const CORS = cors(req.headers.get("origin"));

  // A 204 must carry no body: JSON.stringify into a 204 throws in Deno, the
  // preflight fails, and CORS then blocks the real POST. Same trap the two
  // narrative functions document. Built by hand rather than through json().
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, CORS, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json({ error: "The answer service is not configured. Tell Kate the ANTHROPIC_API_KEY secret is missing." }, CORS, 500);
  }

  let question = "";
  let sheets = "";
  try {
    const body = await req.json();
    question = String(body.question ?? "").trim();
    sheets = String(body.sheets ?? "").trim();
  } catch {
    return json({ error: "Could not read that request." }, CORS, 400);
  }

  if (!question) return json({ error: "Ask a question first." }, CORS, 400);
  if (question.length > MAX_QUESTION_CHARS) {
    return json({ error: `Keep the question under ${MAX_QUESTION_CHARS} characters.` }, CORS, 400);
  }
  if (!sheets) {
    return json({ error: "The sheets did not load, so there is nothing to answer from. Reload the page and try again." }, CORS, 400);
  }
  // A guard, not a truncation of meaning: all four sheets together come to about
  // 33,000 characters. If this trips, the caller is wrong, not the sheets.
  if (sheets.length > MAX_CONTEXT_CHARS) {
    return json({ error: "That is more sheet content than expected. Tell Kate the widget is sending too much." }, CORS, 400);
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const res = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 1500,
      // Opus 5 runs adaptive thinking by default, so `thinking` is omitted on
      // purpose. Medium effort: this is a grounded lookup with a refusal rule,
      // not a reasoning problem. Low would make the refusal discipline sloppier,
      // and a wrong policy answer is the one failure we cannot have.
      output_config: { format: { type: "json_schema", schema: SCHEMA }, effort: "medium" },
      // Server-side fallback, so a safety refusal still returns something the
      // person at the till can act on rather than an error.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        // Stable prefix first so it caches. The system prompt and the sheets do
        // not change between questions; only the question does.
        { type: "text", text: SYSTEM },
        { type: "text", text: `SHEETS\n${sheets}`, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: question }],
    });

    // Opus 5 can decline outright. Check before reading content.
    if (res.stop_reason === "refusal") {
      console.error("[ask] refused", res.stop_details);
      return json({ found: false, answer: "I cannot answer that one. Ask Kate.", source: "not in the sheets", sheet: "" }, CORS);
    }

    const text = res.content.find((b: { type: string }) => b.type === "text");
    if (!text || !("text" in text)) return json({ error: "No answer came back. Try again." }, CORS, 502);

    let out: unknown;
    try {
      out = JSON.parse((text as { text: string }).text);
    } catch {
      console.error("[ask] unparseable output");
      return json({ error: "The answer came back malformed. Try asking it a different way." }, CORS, 502);
    }

    return json(out, CORS);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: "Too many questions at once. Wait a moment and ask again." }, CORS, 429);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return json({ error: "The answer service cannot sign in. Tell Kate the API key needs checking." }, CORS, 500);
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return json({ error: "Could not reach the answer service. Try again in a moment." }, CORS, 503);
    }
    console.error("[ask] failed", error);
    return json({ error: "Something went wrong answering that. The sheets themselves are still correct; scroll and read." }, CORS, 500);
  }
});
