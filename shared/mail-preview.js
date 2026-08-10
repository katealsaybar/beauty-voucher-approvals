/* ==========================================================================
   Device frames and email-client chrome, shared. Plain script, no build step, no
   module, same as notes-widget.js, so the pack still opens off disk as file://.

   Lifted out of automations/ on 8 Aug 2026 so mapping-result/
   could show the same email in the same frames instead of growing a second renderer.
   The function NAMES are deliberately unchanged from the automations map's originals, so
   none of its call sites had to move: only the definitions did.

   MUST LOAD BEFORE the page's own inline script. These are top-level `const` and
   `function` declarations in a classic script, so they are global lexical bindings and are
   visible to any later script, but not to an earlier one.

   Pairs with mail-preview.css. The WhatsApp chrome deliberately stayed in automations.html:
   only that page needs it, and it styles off .phone.samsung / .phone.iphone from here.

   Provided:
     DEVICES, devSpec        handset geometry
     avatar, sbIcons, statusBar, phone, devcol
     gmailPane               Gmail, any handset
     outlookPane             Outlook mobile, any handset
     appleMailPane           Apple Mail on iOS                      (added 8 Aug)
     outlookDesktopPane      Outlook on Windows, a desktop pane      (added 8 Aug)
     subjectOf, fitMailFrames
     MAIL_CLIENTS            the four real-world combinations
     wordEngineRisks         what the Word engine does to a given email
   ========================================================================== */

/* switch label, model name, and the CSS viewport the screen is really rendered at */
const DEVICES=[
  ['samsung','Samsung','Galaxy S25','360 × 780'],
  ['iphone','iPhone','iPhone 16 Pro','402 × 874']
];
function devSpec(kind){
  for(var i=0;i<DEVICES.length;i++) if(DEVICES[i][0]===kind) return DEVICES[i];
  return DEVICES[0];
}

/* Resolved from this script's own URL, not from the page's. The pages that load this file
   sit at two different depths now (automations/ is one down, website-mockups/terms/ is two),
   so a hardcoded ../assets/ would be right for one and broken for the other. This is right
   for both, and stays right if a page moves again. */
var ASSETS = (function () {
  var s = document.currentScript ||
          (function () { var t = document.getElementsByTagName('script'); return t[t.length - 1]; })();
  return new URL('../assets/', s.src).href;
})();

/* the real account picture: the wordmark on black, which is what she sees in her inbox
   and in her chat list */
function avatar(px){
  return '<div class="avatar" style="width:'+px+'px;height:'+px+'px;">'+
    '<img src="'+ASSETS+'tara-rose-logo-white.png" alt="Tara Rose Salon"></div>';
}

function sbIcons(){
  return '<span class="sbicons">'+
    /* signal */
    '<svg width="17" height="12" viewBox="0 0 17 12"><rect x="0" y="8" width="3" height="4" rx="1"/>'+
      '<rect x="4.5" y="6" width="3" height="6" rx="1"/><rect x="9" y="3" width="3" height="9" rx="1"/>'+
      '<rect x="13.5" y="0" width="3" height="12" rx="1"/></svg>'+
    /* wifi */
    '<svg width="15" height="12" viewBox="0 0 15 12"><path d="M7.5 11.2 5.1 8.4a3.7 3.7 0 0 1 4.8 0z"/>'+
      '<path d="M7.5 4.1a7.4 7.4 0 0 0-5 1.9L1.2 4.5a9.6 9.6 0 0 1 12.6 0L12.5 6a7.4 7.4 0 0 0-5-1.9z"/></svg>'+
    /* battery */
    '<svg width="24" height="12" viewBox="0 0 24 12"><rect x="0.5" y="0.5" width="20" height="11" rx="3" '+
      'fill="none" stroke="currentColor" stroke-opacity=".45"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.6"/>'+
      '<path d="M22 4.2v3.6a2.2 2.2 0 0 0 0-3.6z" fill-opacity=".45"/></svg>'+
  '</span>';
}
function statusBar(kind,dark){
  return '<div class="statusbar '+kind+'" style="color:'+(dark?'#fff':'#111')+'">'+
    '<span>9:41</span>'+sbIcons()+'</div>';
}

/* the frame itself. kind decides the shell, the camera cut-out and the home indicator. */
function phone(kind,inner){
  var cut,keys,bottom;
  if(kind==='iphone'){
    cut='<div class="island"></div>';
    keys='<i class="key act"></i><i class="key volu"></i><i class="key vold"></i><i class="key side"></i>';
    bottom='<div class="homebar"></div>';
  } else {
    cut='<div class="cam"></div>';
    keys='<i class="key vol"></i><i class="key pwr"></i>';
    bottom='<div class="navbar"><i class="recent"></i><i class="home"></i><i class="back"></i></div>';
  }
  return '<div class="phone '+kind+'">'+cut+keys+'<div class="screen">'+inner+bottom+'</div></div>';
}

/* A labelled column with a handset in it.
   opts.noswitch hides the Samsung/iPhone switch. The result mockup names the handset in
   the toggle it was opened from ("Gmail · iPhone"), so a second control that could
   contradict that label would only confuse. The automations map keeps its switch. */
function devcol(side,label,kind,inner,opts){
  opts=opts||{};
  var sw='';
  if(!opts.noswitch){
    sw='<div class="devswitch">'+DEVICES.map(function(d){
      return '<button data-side="'+side+'" data-dev="'+d[0]+'" title="'+d[2]+'"'+
        (d[0]===kind?' class="active"':'')+'>'+d[1]+'</button>';
    }).join('')+'</div>';
  }
  var d=devSpec(kind);
  return '<div class="devcol"><div class="devlbl">'+label+' &middot; '+d[2]+'</div>'+
    '<div class="devspec">'+d[3]+' CSS px</div>'+
    sw+phone(kind,inner)+'</div>';
}

function gmailPane(side,kind,subject,opts){
  var inner='<div style="background:#fff;">'+statusBar(kind,false)+'</div>'+
    '<div class="gm-bar"><svg viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>'+
      '<span style="flex:1"></span>'+
      '<svg viewBox="0 0 24 24"><path d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 8 5 4h14l2 4"/><path d="M10 12h4"/></svg>'+
      '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/></svg>'+
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>'+
    '</div>'+
    '<div class="gm-subject">'+mailEsc(subject)+'</div>'+
    '<div class="gm-sender">'+avatar(34)+
      '<div class="gm-from">Tara Rose Salon<small>to me &#9662;</small></div>'+
      '<div style="font:400 12px/1 Roboto,Arial,sans-serif;color:#5f6368;">09:41</div></div>'+
    '<div class="scrollarea"><iframe data-mail="1" title="Gmail phone preview"></iframe></div>';
  return devcol(side,'Gmail',kind,inner,opts);
}

function outlookPane(side,kind,subject,opts){
  var inner='<div style="background:#0F6CBD;">'+statusBar(kind,true)+'</div>'+
    '<div class="ol-bar"><svg viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>'+
      '<span style="flex:1"></span>'+
      '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/></svg>'+
      '<svg viewBox="0 0 24 24"><path d="M4 4h16v12H7l-3 3z"/></svg>'+
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>'+
    '</div>'+
    '<div class="ol-subject">'+mailEsc(subject)+'</div>'+
    '<div class="ol-sender">'+avatar(34)+
      '<div class="ol-from">Tara Rose Salon<small>To: you &nbsp;&middot;&nbsp; 09:41</small></div></div>'+
    '<div class="scrollarea"><iframe data-mail="1" title="Outlook phone preview"></iframe></div>';
  return devcol(side,'Outlook',kind,inner,opts);
}

/* ===== Apple Mail on iOS =====
   Worth its own pane because it is the most CSS-capable client on the list: if something
   looks right ONLY here, it is broken everywhere else. */
function appleMailPane(side,kind,subject,opts){
  var tool=function(p){return '<svg viewBox="0 0 24 24">'+p+'</svg>';};
  var inner='<div style="background:#F9F9F9;">'+statusBar(kind,false)+'</div>'+
    '<div class="am-bar">'+
      '<span class="am-back"><span class="am-chev">&#8249;</span>Inbox</span>'+
      '<span class="am-updown"><i>&#9650;</i><i class="off">&#9660;</i></span>'+
    '</div>'+
    '<div class="am-sender">'+avatar(38)+
      '<div class="am-from">Tara Rose Salon<small>To: you</small></div>'+
      '<div class="am-when">09:41</div></div>'+
    '<div class="am-subject">'+mailEsc(subject)+'</div>'+
    '<div class="scrollarea"><iframe data-mail="1" title="Apple Mail phone preview"></iframe></div>'+
    '<div class="am-tools">'+
      tool('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/>')+
      tool('<path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H3z"/>')+
      tool('<path d="M9 14 4 9l5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v3"/>')+
      tool('<path d="M12 4v16"/><path d="M4 12h16"/>')+
    '</div>';
  return devcol(side,'Apple Mail',kind,inner,opts);
}

/* ===== Outlook on Windows, the desktop reading pane =====
   Not a handset, on purpose. This is the client that renders through Word rather than a
   browser engine, and it is read on a laptop.

   Be clear about what this can and cannot do: it puts the email at a real desktop reading
   width inside real Outlook chrome, which catches width and layout problems. It CANNOT
   emulate the Word engine: nothing in a browser can. wordEngineRisks() below is what
   covers that gap, by reading the email's own source. */
function outlookDesktopPane(subject,html){
  var ico=function(p){return '<svg viewBox="0 0 24 24">'+p+'</svg>';};
  var risks=wordEngineRisks(html);
  var warn='<div class="wordwarn"><strong>This is the frame and the width, not the engine.</strong> '+
    'Outlook on Windows renders through Word, not a browser, so no preview in a browser can show you '+
    'what it really does. What Word will change in <em>this</em> email, read off its own source:'+
    '<ul>'+risks.map(function(r){
      return '<li><span class="wtag '+r.level+'">'+(r.level==='bad'?'Breaks':'Shifts')+'</span>'+r.text+'</li>';
    }).join('')+'</ul></div>';

  return '<div class="devcol">'+
    '<div class="devlbl">Outlook &middot; Windows desktop</div>'+
    '<div class="devspec">820 CSS px reading pane &middot; Word engine</div>'+
    '<div class="desktop">'+
      '<div class="winbar"><span class="wtitle">Inbox - you@yourcompany.com - Outlook</span>'+
        '<span class="wbtns"><i>&#8211;</i><i>&#9723;</i><i class="x">&#10005;</i></span></div>'+
      '<div class="olribbon">'+
        '<span>'+ico('<path d="M9 14 4 9l5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v3"/>')+'Reply</span>'+
        '<span>'+ico('<path d="M7 14 2 9l5-5"/><path d="M13 14 8 9l5-5"/><path d="M8 9h7a7 7 0 0 1 7 7v3"/>')+'Reply All</span>'+
        '<span>'+ico('<path d="m15 14 5-5-5-5"/><path d="M20 9H11a7 7 0 0 0-7 7v3"/>')+'Forward</span>'+
        '<span>'+ico('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/>')+'Delete</span>'+
      '</div>'+
      '<div class="olread">'+
        '<div class="ol-desk-subject">'+mailEsc(subject)+'</div>'+
        '<div class="ol-desk-sender">'+avatar(40)+
          '<div class="ol-desk-from">Tara Rose Salon<small>no-reply@tararosesalon.com</small></div>'+
          '<div class="ol-desk-when">Sat 08/08/2026 09:41</div></div>'+
        '<div class="ol-desk-actions"><b>Reply</b><b>Reply All</b><b>Forward</b></div>'+
      '</div>'+
      '<div class="deskscroll"><iframe data-mail="1" title="Outlook Windows desktop preview"></iframe></div>'+
    '</div>'+
    warn+
  '</div>';
}

/* ===== what the Word engine does to a given email =====
   Read off the email's own HTML rather than written as generic advice, so it stays true if
   the asset changes and cannot quietly go stale. Each entry says the CAUSE and the EFFECT,
   because "no rgba support" on its own tells reception nothing.

   'bad'  = she cannot read something, or a required link disappears
   'mid'  = it still reads, but not as drawn */
function wordEngineRisks(html){
  html = html || '';
  var out = [];

  /* The serious one. Word has never supported rgba() colour values, so the declaration is
     dropped and the text falls back to the inherited colour, which on these emails means
     near-black text sitting on a #0D0D0D footer. The unsubscribe link is in that footer. */
  var rgbaText = (html.match(/color\s*:\s*rgba\(/gi) || []).length;
  var darkFooter = /background-color\s*:\s*#0D0D0D/i.test(html);
  if (rgbaText) {
    out.push({
      level: darkFooter ? 'bad' : 'mid',
      text: '<code>' + rgbaText + '&times; color:rgba(&hellip;)</code>: Word does not support ' +
            'rgba colour, so it drops the declaration and the text inherits near-black' +
            (darkFooter
              ? '. Those are all in the black footer, so the footer text <strong>and the unsubscribe link</strong> ' +
                'go black-on-black and become unreadable. Fix is a solid hex, one line per email.'
              : '. Contrast will not be what was drawn.')
    });
  }

  var radii = (html.match(/border-radius/gi) || []).length;
  if (radii) out.push({ level:'mid',
    text:'<code>'+radii+'&times; border-radius</code>: ignored, so the card, the '+
         '&ldquo;What we heard&rdquo; box and the pill button all render with square corners.' });

  /* Unitless line-height is a percentage to Word and it adds its own leading on top, so
     copy set at 1.62 comes out looser than drawn unless the rule is pinned. */
  var loose = (html.match(/line-height\s*:\s*\d?\.\d+\s*[;"]/g) || []).length;
  var pinned = (html.match(/mso-line-height-rule/gi) || []).length;
  if (loose > pinned) out.push({ level:'mid',
    text:'<code>'+(loose-pinned)+' unitless line-height</code> without '+
         '<code>mso-line-height-rule:exactly</code>: Word adds its own leading, so those '+
         'paragraphs sit looser than they do here.' });

  /* Word applies padding to a <div> unreliably; on these emails the header stack relies on
     it for the gaps between the wordmark, SALON and the italic line. */
  if (/<div[^>]*style="[^"]*padding/i.test(html)) out.push({ level:'mid',
    text:'<code>padding</code> on a <code>&lt;div&gt;</code>: honoured in tables, unreliable on a div, '+
         'so the stacked header lines can close up against each other.' });

  if (/@media/i.test(html)) out.push({ level:'mid',
    text:'<code>@media</code>: ignored entirely. Not a defect here: at 820px the desktop pane '+
         'wants the 600px desktop layout anyway, which is what it gets.' });

  /* the things this email gets RIGHT for Word, worth saying so nobody "fixes" them */
  var good = [];
  if (/width="600"/.test(html)) good.push('a <code>width="600"</code> attribute as well as CSS');
  if (/mso-hide\s*:\s*all/i.test(html)) good.push('<code>mso-hide:all</code> on the preheader');
  if (!/<img(?![^>]*logo)/i.test(html) || /Tara&nbsp;Rose<\/div>/.test(html)) good.push('a typeset wordmark rather than an image');
  if (good.length) out.push({ level:'mid',
    text:'<strong>Already right for Word:</strong> '+good.join(', ')+'. Leave those alone.' });

  if (!out.length) out.push({ level:'mid', text:'Nothing in this email trips the known Word-engine failures.' });
  return out;
}

/* ===== the four combinations worth checking =====
   Client and platform are two different axes, so a row of "Gmail / Outlook / iPhone /
   Android" would mix them and mean nothing: Gmail runs on both handsets. These are four real
   combinations instead, and between them they isolate both variables,
     Gmail·Android vs Gmail·iPhone     same client, different WIDTH (360 vs 402)
     Gmail·iPhone  vs Apple Mail·iPhone same width, different CSS SUPPORT
     Outlook·Windows                    the only one that is not a browser engine at all
   Outlook on Windows earns its place by being the one that genuinely breaks emails.
   "It looked fine in Gmail" is how a broken email ships. */
const MAIL_CLIENTS=[
  { id:'gmail-android', btn:'Gmail &middot; Android',      pane:'gmail',      kind:'samsung',
    why:'The most common combination we send to. Gmail’s app strips some CSS, and at 360px it is the narrowest screen the email has to survive.' },
  { id:'gmail-iphone',  btn:'Gmail &middot; iPhone',       pane:'gmail',      kind:'iphone',
    why:'Same client, 42px wider. This is the pair that answers “does the first screen still hold the headline and the button”.' },
  { id:'apple-iphone',  btn:'Apple Mail &middot; iPhone',  pane:'applemail',  kind:'iphone',
    why:'The most capable client on the list. If something looks right only here, it is broken everywhere else, so this is the pane to trust least when judging whether the email is safe.' },
  { id:'outlook-win',   btn:'Outlook &middot; Windows',    pane:'outlookdesk',kind:null,
    why:'The one that genuinely breaks emails, because it renders through Word rather than a browser engine. Not a phone: a desktop reading pane, which is where it is actually read.' }
];

/* render one combination. html is the built email; subject comes out of its <title>. */
function mailClientPane(id,html){
  var c=null;
  for(var i=0;i<MAIL_CLIENTS.length;i++) if(MAIL_CLIENTS[i].id===id) c=MAIL_CLIENTS[i];
  if(!c) c=MAIL_CLIENTS[0];
  var subj=subjectOf(html);
  if(c.pane==='outlookdesk') return outlookDesktopPane(subj,html);
  var o={noswitch:true};
  if(c.pane==='applemail') return appleMailPane('only',c.kind,subj,o);
  if(c.pane==='outlook')   return outlookPane('only',c.kind,subj,o);
  return gmailPane('only',c.kind,subj,o);
}

/* the email <title> is the subject line, so the inbox chrome shows the real thing */
function subjectOf(html){
  var m=/<title>([\s\S]*?)<\/title>/i.exec(html||'');
  return m ? m[1].trim() : 'Tara Rose Salon Group';
}

/* srcdoc is same-origin, so the frame can be sized to its own content and scrolled
   inside the phone rather than clipped at a guessed height */
function fitMailFrames(root,html){
  root.querySelectorAll('iframe[data-mail]').forEach(function(ifr){
    ifr.addEventListener('load',function(){
      try{
        var d=ifr.contentDocument;
        ifr.style.height=Math.max(d.body.scrollHeight,d.documentElement.scrollHeight)+'px';
      }catch(err){ ifr.style.height='2200px'; }
    });
    ifr.srcdoc=html;
  });
}

/* local, so this file does not depend on the host page defining esc() */
function mailEsc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
