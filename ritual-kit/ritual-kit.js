/* ------------------------------------------------------------------
   Three tables, kept apart on purpose.

   TIERS    how many slots are prescribed, and the allowance towards them.
   SLOTS    the fixed order. Never reordered, never skipped.
   BUNDLES  per concern, per emirate, the six actual products and prices.

   Prices are AED shelf value read from the TRS Beauty Stock sheet on
   7 Aug 2026, worst case across the two branches in that emirate, so a
   build that passes the cap here passes at either branch.

   Adding a branch must never add a row to BUNDLES. If someone later asks
   for a branch-specific kit, that is a doctrine change, not an edit.
------------------------------------------------------------------- */

var TIERS = {
  t1:{name:'Dip Your Toes', care:'Protect',              slots:2, cap:100,
      price:'AED 1,000 &rarr; 1,150 &middot; 6 months'},
  t2:{name:'Season of You', care:'Protect &amp; Maintain', slots:4, cap:200,
      price:'AED 2,500 &rarr; 3,000 &middot; 9 months'},
  t3:{name:'All-In VIP Year', care:'Full Insurance',     slots:6, cap:450,
      price:'AED 4,500 &rarr; 5,400 &middot; 12 months'}
};

var SLOTS = [
  {t:'Hero treatment',        w:'Matched to what she ticked. This is the item the whole kit is built around.'},
  {t:'Heat shield',           w:'The daily shield. Heat, sun and friction, the everyday things that undo the result.'},
  {t:'Shampoo, matched',      w:'Her supermarket wash is undoing the chair every time. This is the half of the routine she never thinks about.'},
  {t:'Conditioner, matched',  w:'Pairs with the shampoo. Splitting the pair is the commonest way a routine stops working.'},
  {t:'Weekly mask',           w:'Rebuilds on top of the daily routine, so the result compounds rather than only holding.'},
  {t:'Scalp or water defence',w:'The scalp is the skin the hair grows from. Settle it and everything above it works better.'}
];

/* order = priority when she ticks more than one box. Detox first, treat second, tone third. */
var BUNDLES = [
  {k:'detox', tick:'Feels coated, heavy or weighed down', cat:'Detox and hard water', status:'locked',
   why:'the wash itself is what is weighing it down',
   cons:'everything we put on top sits on a coated canvas and does not take properly',
   ad:[['Malibu Blondes 5g',132],['ABC Primer spray 250ml',133],['ABC Deep Cleansing Shampoo 300ml',135],
       ['ABC Replenish Conditioner 250ml',149],['ABC Replenish Mask 200ml',225],['Alterna Scalp Rituals Scrub 177ml',236]],
   dxb:[['Malibu Blondes 5g',132],['ABC Primer spray 250ml',133],['ABC Deep Cleansing Shampoo 300ml',135],
       ['ABC Replenish Conditioner 250ml',154],['ABC Replenish Mask 200ml',225],['Alterna Scalp Rituals Scrub 177ml',236]]},

  {k:'scalp', tick:'Itchy, oily or flaky scalp', cat:'Scalp', status:'locked',
   why:'your scalp is the skin the hair grows out of, and it is unsettled',
   cons:'the condition further down never really improves, because it is starting badly',
   ad:[['Alterna Scalp Rituals Peppermint 74ml',140],['ABC Primer spray 250ml',133],['ABC Deep Cleansing Shampoo 300ml',135],
       ['ABC Replenish Conditioner 250ml',149],['ABC Detox Scalp Mud 165g',302],['Malibu Blondes 5g',132]],
   dxb:[['Alterna Scalp Rituals Peppermint 74ml',140],['ABC Primer spray 250ml',133],['ABC Deep Cleansing Shampoo 300ml',135],
       ['ABC Replenish Conditioner 250ml',154],['ABC Detox Scalp Mud 165g',302],['Malibu Blondes 5g',132]]},

  {k:'bond', tick:'Breakage, damage or weakness', cat:'Bond repair', status:'locked',
   why:'the hair has lost strength and is snapping rather than growing',
   cons:'the length you are trying to keep keeps breaking off faster than it grows',
   ad:[['BlondMe Bondfinity Deep Repair Oil 50ml',126],['ABC Primer spray 250ml',133],['BlondMe Bond Repair Nourishing Shampoo 300ml',136],
       ['BlondMe Bond Repair Nourishing Conditioner 250ml',138],['BlondMe Bond Repair Nourishing Mask 200ml',156],['BlondMe Bond Repair Sealing Balm 75ml',114]],
   dxb:[['BlondMe Bondfinity Deep Repair Oil 50ml',126],['ABC Primer spray 250ml',133],['BlondMe Bond Repair Nourishing Shampoo 300ml',136],
       ['BlondMe Bond Repair Nourishing Conditioner 250ml',138],['BlondMe Bond Repair Nourishing Mask 200ml',156],['BlondMe Bond Repair Sealing Balm 75ml',114]]},

  {k:'correct', tick:'A colour I want to correct or fix', cat:'Bond repair', status:'locked', pushfull:true,
   why:'a correction asks a lot of the hair in one sitting',
   cons:'the correction we do holds for weeks rather than months',
   ad:[['BlondMe Bondfinity Deep Repair Oil 50ml',126],['ABC Primer spray 250ml',133],['BlondMe Bond Repair Nourishing Shampoo 300ml',136],
       ['BlondMe Bond Repair Nourishing Conditioner 250ml',138],['BlondMe Bond Repair Nourishing Mask 200ml',156],['BlondMe Bond Repair Sealing Balm 75ml',114]],
   dxb:[['BlondMe Bondfinity Deep Repair Oil 50ml',126],['ABC Primer spray 250ml',133],['BlondMe Bond Repair Nourishing Shampoo 300ml',136],
       ['BlondMe Bond Repair Nourishing Conditioner 250ml',138],['BlondMe Bond Repair Nourishing Mask 200ml',156],['BlondMe Bond Repair Sealing Balm 75ml',114]]},

  {k:'curls', tick:'Curls or texture that will not behave', cat:'Curls', status:'locked',
   why:'your texture needs moisture and definition, not weight',
   cons:'the curl drops and frizzes within a day of washing',
   ad:[['Kevin Murphy Killer Twirls 150ml',152],['ABC Primer spray 250ml',133],['Kevin Murphy Killer Curls Wash 250ml',136],
       ['Kevin Murphy Killer Curls Rinse 250ml',136],['ABC Hydrate Intense Treatment 200ml',219],['Malibu Blondes 5g',132]],
   dxb:[['ABC Hydrate Curl Enhancer 250ml',149],['ABC Primer spray 250ml',133],['ABC Hydrate Shampoo 300ml',128],
       ['ABC Hydrate Spray Conditioner 250ml',168],['ABC Hydrate Mask 200ml',219],['Malibu Blondes 5g',132]]},

  {k:'blonde', tick:'My blonde goes brassy or warm', cat:'Blonde and colour', status:'locked',
   why:'your blonde is being pulled warm between visits',
   cons:'the tone we put in fades to brass long before your next appointment',
   ad:[['BlondMe Bond Repair Purple Mask 200ml',165],['ABC Primer spray 250ml',133],['BlondMe Bond Repair Purple Shampoo 300ml',136],
       ['BlondMe Bond Repair Purple Spray Conditioner 150ml',137],['BlondMe Bond Repair Nourishing Mask 200ml',156],['Malibu Blondes 5g',132]],
   dxb:[['BlondMe Bond Repair Purple Mask 200ml',165],['ABC Primer spray 250ml',133],['BlondMe Bond Repair Purple Shampoo 300ml',136],
       ['BlondMe Bond Repair Purple Conditioner 250ml',138],['Kevin Murphy Blonde Colour Enhancing Treatment 250ml',167],['Malibu Blondes 5g',132]]},

  {k:'smooth', tick:'I want it smoother, less styling time', cat:'Smoothing', status:'locked',
   why:'you are fighting frizz with heat every morning',
   cons:'you keep styling the same problem instead of solving it',
   ad:[['Fibre Clinix RL Rich Cream-to-oil 100ml',184],['ABC Primer spray 250ml',133],['ABC Hydrate Shampoo 300ml',128],
       ['ABC Replenish Conditioner 250ml',149],['ABC Hydrate Intense Treatment 200ml',219],['Malibu Blondes 5g',132]],
   dxb:[['Fibre Clinix Rich Cream-to-Oil',184],['ABC Primer spray 250ml',133],['Brazilian Blowout Anti-Frizz Shampoo 350ml',151],
       ['Brazilian Blowout Anti-Frizz Conditioner 350ml',151],['Brazilian Blowout Deep Conditioning Masque',175],['Malibu Blondes 5g',132]]},

  {k:'dry', tick:'Dry, frizzy or hard to manage', cat:'Hydration', status:'locked',
   why:'the hair is dry, so it will not sit or behave',
   cons:'it stays rough and hard to work with no matter what we do in the chair',
   ad:[['Alterna Caviar Moisture CC Cream 100ml',202],['ABC Primer spray 250ml',133],['Kevin Murphy Hydrate Me Wash 250ml',142],
       ['Kevin Murphy Hydrate Me Rinse 250ml',142],['ABC Hydrate Intense Treatment 200ml',219],['Malibu Blondes 5g',132]],
   dxb:[['Alterna Caviar Moisture CC Cream 100ml',202],['ABC Primer spray 250ml',133],['ABC Hydrate Shampoo 300ml',128],
       ['ABC Hydrate Spray Conditioner 250ml',168],['ABC Hydrate Mask 200ml',219],['Malibu Blondes 5g',132]]},

  /* --- the two with no locked hero line. Interim builds, marked as such.
         Shedding used to be a third entry here and was removed on 8 Aug. It never had
         products of its own, it borrowed the scalp bundle whole, and on the live form
         "More shedding or thinning" is not a Stage 2 tick at all: it is one option on the
         radio question "Have you noticed your hair changing recently?". So the tree was
         looking for it somewhere it could never be found. It is now a flag in Stop and
         check instead, which is also the honest place for it, because it is the one answer
         the tree itself warns can be medical. --- */
  {k:'brunette', tick:'My brunette looks flat or dull', cat:'Hydration, interim', status:'call', borrow:'dry',
   gap:'There is no locked hero line for dull brunette. The hydration bundle is the safe interim, because dullness reads as dryness, but it is not confirmed.',
   why:'dull usually means dry, and dry does not reflect light',
   cons:'the depth and shine we build in the chair flattens off within a couple of washes'},

  {k:'fade', tick:'My colour fades too fast', cat:'Detox and hard water, interim', status:'call', borrow:'detox',
   gap:'No locked hero line. Hard water is the most likely cause of fast fade here, so the detox bundle is the interim. Tara has not confirmed it, and the water filter the doctrine calls for is not stocked anywhere.',
   why:'the water here works against colour every time you wash',
   cons:'you are paying for colour that starts leaving on the first wash'}
];

/* resolve the interim concerns to the bundle they borrow, so there is one list to maintain */
function picksFor(c, em){
  var src = c.borrow ? BUNDLES.filter(function(x){return x.k===c.borrow;})[0] : c;
  return src[em];
}
function emirate(){ return document.body.classList.contains('v-dxb') ? 'dxb' : 'ad'; }
function total(picks, n){ return picks.slice(0,n).reduce(function(s,p){return s+p[1];},0); }
function money(n){ return n.toLocaleString('en-AE',{maximumFractionDigits:0}); }

/* ---------------- concern buttons ---------------- */
var optwrap = document.getElementById('concernopts');
BUNDLES.forEach(function(c,i){
  var b = document.createElement('button');
  b.className = 'opt wide';
  b.dataset.k = 'concern'; b.dataset.v = c.k;
  b.innerHTML = '<span>' + (i+1) + '. ' + c.tick + '</span><small>' + c.cat +
                (c.status==='call' ? ' &middot; Tara to confirm' : '') + '</small>';
  optwrap.appendChild(b);
});

/* ---------------- state ---------------- */
var state = {gate:null, tier:null, concern:null, shed:null, henna:null, homecare:null, detox:null};
var laterSteps = ['s3','s4','s5','s6'];
function hideLater(from){
  laterSteps.slice(from).forEach(function(id){ document.getElementById(id).hidden = true; });
}

document.querySelectorAll('.opt').forEach(function(b){
  b.addEventListener('click', function(){
    var k = b.dataset.k, v = b.dataset.v;
    state[k] = v;
    b.parentNode.querySelectorAll('.opt').forEach(function(x){ x.classList.remove('on'); });
    b.classList.add('on');
    document.getElementById('restart').hidden = false;
    if(k==='gate'){
      state.tier = null; state.concern = null; state.shed = null; state.henna = null; state.homecare = null; state.detox = null;
      document.getElementById('s1').hidden = (v!=='yes');
      document.getElementById('s2').hidden = true;
      hideLater(0);
    }
    if(k==='tier'){
      state.concern = null; state.shed = null; state.henna = null; state.homecare = null; state.detox = null;
      document.getElementById('s2').hidden = false;
      hideLater(0);
    }
    if(k==='concern'){
      state.shed = null; state.henna = null; state.homecare = null; state.detox = null;
      document.getElementById('s3').hidden = false;
      hideLater(1);
    }
    if(k==='shed'){ document.getElementById('s4').hidden = false; hideLater(2); }
    if(k==='henna'){ document.getElementById('s5').hidden = false; hideLater(3); }
    if(k==='homecare'){ document.getElementById('s6').hidden = false; }
    render();
  });
});

document.getElementById('restart').addEventListener('click', function(){
  state = {gate:null, tier:null, concern:null, shed:null, henna:null, homecare:null, detox:null};
  document.querySelectorAll('.opt').forEach(function(x){ x.classList.remove('on'); });
  document.getElementById('s1').hidden = true;
  document.getElementById('s2').hidden = true;
  hideLater(0);
  document.getElementById('out').hidden = true;
  this.hidden = true;
});

/* ---------------- the answer card ---------------- */
function render(){
  var out = document.getElementById('out');

  if(state.gate==='no'){
    out.hidden = false;
    out.innerHTML =
      '<div class="outtop"><span class="outtier">No map, no kit.</span><span class="chip stop">Stop here</span></div>' +
      '<p>Her welcome email has already told her the kit is being personalised and released after her Confidence Mapping. Handing it over now makes the mapping optional, and she will not come back for it.</p>' +
      '<div class="script"><b>What you say</b>&ldquo;Your kit is being made up for you, but it is matched to your hair rather than picked off a shelf, so we do your Confidence Mapping first. It is free, it takes about ten minutes, and it is what tells us what to put in it. Shall I book that now?&rdquo;</div>' +
      '<p style="margin-top:14px;"><strong>Then:</strong> book the mapping, and set the kit aside under her name so it is visibly hers and not a maybe.</p>';
    return;
  }

  if(!(state.gate==='yes' && state.tier && state.concern && state.shed && state.henna && state.homecare && state.detox)){ out.hidden = true; return; }

  var t = TIERS[state.tier];
  var orig = BUNDLES.filter(function(x){ return x.k===state.concern; })[0];
  var detoxOverride = state.detox==='never' && orig.k!=='detox';
  var c = detoxOverride ? BUNDLES.filter(function(x){ return x.k==='detox'; })[0] : orig;
  var picks = picksFor(c, emirate());
  var sum = total(picks, t.slots);
  var over = sum > t.cap;
  var pct = Math.min(100, Math.round(sum / t.cap * 100));

  var html =
    '<div class="outtop">' +
      '<span class="outtier">' + t.care + '</span>' +
      '<span class="chip locked">' + t.slots + ' items</span>' +
      (c.status==='call' ? '<span class="chip call">Interim, Tara to confirm</span>'
                         : '<span class="chip locked">Locked line</span>') +
      '<span style="margin-left:auto;font-size:13px;color:var(--muted);">' + t.name + ' &middot; ' + t.price + '</span>' +
    '</div>' +
    '<p style="margin-top:0;"><strong>' + c.cat + '</strong> &middot; <span style="color:var(--muted);">' +
      (emirate()==='ad' ? 'Abu Dhabi shelf' : 'Dubai shelf') + '</span></p>';

  if(detoxOverride){
    html += '<div class="note flag" style="margin:12px 0;"><strong>Overridden to detox, Stage 4.</strong> She ticked &ldquo;' + orig.tick +
            '&rdquo; at Stage 2, but her scalp-reset answer, &ldquo;Never, I did not know I should&rdquo;, moves her to a detox build first, whatever she ticked. <span class="chip stop">Stage 4 override</span></div>';
  }
  if(c.gap && !detoxOverride){
    html += '<div class="note flag" style="margin:12px 0;"><strong>This one is not locked yet.</strong> ' + c.gap +
            ' Hand over the interim, then log it for your manager.</div>';
  }
  if(c.pushfull && state.tier!=='t3' && !detoxOverride){
    html += '<div class="note info" style="margin:12px 0;"><strong>Worth saying out loud.</strong> A correction is what Full Insurance exists for. She is not on that tier, so be honest that this kit protects the correction rather than compounding it.</div>';
  }
  if(state.tier==='t1' && !detoxOverride && (c.k==='blonde' || c.k==='fade' || c.k==='brunette' || c.k==='correct')){
    html += '<div class="note info" style="margin:12px 0;"><strong>Note the mismatch.</strong> Dip Your Toes spends on any service, colour included, but AED 1,150 does not stretch to a correction, so in practice this kit protects colour she already has rather than colour we did. Say that plainly, and say it as a budget, not a rule.</div>';
  }

  if(state.henna==='keratin' && detoxOverride){
    html += '<div class="note bad" style="margin:12px 0;"><strong>Stop before you build this bag.</strong> Stage 4 moves her to a detox build, and Stage 3 says keratin or a smoothing treatment. Do not put a detox or clarifying cleanser in her kit without the stylist signing it off first. <span class="chip stop">Stylist signs off</span></div>';
  } else if(state.henna==='keratin'){
    html += '<div class="note bad" style="margin:12px 0;"><strong>Keratin or a smoothing treatment, Stage 3.</strong> Do not put a detox or clarifying cleanser in her kit without the stylist signing it off. <span class="chip stop">Stylist signs off</span></div>';
  }
  if(state.henna==='henna'){
    html += '<div class="note flag" style="margin:12px 0;"><strong>Henna, Stage 3.</strong> Kit is unaffected, but the note travels with her, in front of the colourist before any colour is planned. <span class="chip stop">Flag on the card</span></div>';
  }
  if(state.henna==='both' || state.henna==='notsure'){
    html += '<div class="note bad" style="margin:12px 0;"><strong>' + (state.henna==='both' ? 'Both, Stage 3.' : 'Not sure, Stage 3.') +
            '</strong> Stylist signs the kit off before it leaves the salon. <span class="chip stop">Stylist signs off</span></div>';
  }
  if(state.shed==='yes'){
    html += '<div class="note flag" style="margin:12px 0;"><strong>Shedding or thinning ticked, Stage 2.</strong> It does not change the build above. Make no claim about regrowth, and route her to her stylist. <span class="chip stop">Flag on the card</span></div>';
  }
  if(state.homecare==='supermarket' && state.tier==='t1'){
    html += '<div class="note info" style="margin:12px 0;"><strong>Home care opening, Stage 4.</strong> Dip Your Toes has no wash pair in her kit. This is where you explain what her current supermarket wash is doing, and what Season of You would cover.</div>';
  } else if(state.homecare==='supermarket'){
    html += '<div class="note info" style="margin:12px 0;"><strong>Home care opening, Stage 4.</strong> She is on a supermarket wash. Point out her matched shampoo and conditioner in this bag are the pair actually built to work with the rest of it.</div>';
  }

  html += '<h3 style="margin-top:18px;">What goes in the bag</h3><ul class="kititems">';
  picks.slice(0, t.slots).forEach(function(p,i){
    html += '<li><span class="n">' + (i+1) + '</span>' +
            '<span class="body"><span class="it">' + p[0] + '</span>' +
            '<span class="why">' + SLOTS[i].t + '. ' + SLOTS[i].w + '</span></span>' +
            '<span class="px">' + money(p[1]) + '</span></li>';
  });
  html += '</ul>';

  html +=
    '<div class="capbar"><div class="head">' +
      '<span class="lbl">Staff only &middot; shelf value against her allowance</span>' +
      '<span class="nums">AED ' + money(sum) + ' of ' + money(t.cap) + '</span>' +
    '</div>' +
    '<div class="track"><div class="fill' + (over?' over':'') + '" style="width:' + pct + '%"></div></div>' +
    '<div class="foot">' + (over
      ? '<strong>She pays AED ' + money(sum - t.cap) + ' at the till.</strong> Her allowance covers AED ' + money(t.cap) + ' of this kit, and the rest is hers to settle. <b>Tell her the number before you build the bag</b>, never after. She can also drop an item to bring the total down.'
      : 'AED ' + money(t.cap - sum) + ' of her allowance unused. Do not pad the bag to spend it, the kit is a prescription and the allowance is a ceiling, not a target.') +
    '</div></div>';

  html +=
    '<div class="script"><b>Her Because, filled in from her map</b>' +
    '&ldquo;I am giving you this because ' + c.why + ', and without it ' + c.cons + '.&rdquo;' +
    '<div style="margin-top:9px;font-size:13px;color:var(--muted);">Then seven seconds of silence. Do not fill it.</div></div>';

  if(state.tier==='t3'){
    html += '<div class="note good" style="margin-top:14px;"><strong>Also hers on this tier:</strong> the home skin care set, the Reset Journal and the 8 Pillars of Wellness Journal. ' +
            '<span class="only-ad">Handed over at her own branch alongside her birthday facial.</span>' +
            '<span class="only-dxb">The skin set sits with Al Quoz, where the Dubai birthday facial is set. Hand it over at that visit.</span>' +
            ' These sit outside the kit cap.</div>';
  }

  out.hidden = false;
  out.innerHTML = html;
}

/* ---------------- the printable matrix ---------------- */
function buildMatrix(){
  var body = document.getElementById('matrixbody');
  var em = emirate();
  body.innerHTML = '';
  BUNDLES.forEach(function(c){
    var picks = picksFor(c, em);
    var tr = document.createElement('tr');
    var list = picks.map(function(p,i){
      return '<span style="color:var(--muted);">' + (i+1) + '.</span> ' + p[0] +
             ' <span style="color:var(--muted);font-variant-numeric:tabular-nums;">' + money(p[1]) + '</span>';
    }).join('<br>');
    /* the total on top, the room left against the cap underneath, so nobody has to
       hold the cap in their head while reading down a column */
    function cell(n,cap){
      var s = total(picks,n), left = cap - s;
      return '<td class="num" style="' + (s>cap?'color:var(--red);':'') + '">' + money(s) +
             '<span class="under">' + (left<0 ? 'over by ' + money(-left) : money(left) + ' left') + '</span></td>';
    }
    tr.innerHTML =
      '<td>' + c.tick + (c.status==='call' ? '<br><span class="chip call">Tara</span>' : '') +
        '<br><span style="color:var(--muted);font-size:12.5px;">' + c.cat + '</span></td>' +
      '<td style="font-size:13px;line-height:1.75;">' + list + '</td>' +
      cell(2,100) + cell(4,200) + cell(6,450);
    body.appendChild(tr);
  });
}

/* ---------------- emirate switch ---------------- */
var bAd = document.getElementById('btn-ad'), bDx = document.getElementById('btn-dxb');
/* toggle rather than reassign className: the notes widget puts its own classes
   on <body>, and a straight assignment would quietly wipe them */
function setEmirate(e){
  document.body.classList.toggle('v-ad',  e==='ad');
  document.body.classList.toggle('v-dxb', e==='dxb');
  bAd.classList.toggle('on', e==='ad');
  bDx.classList.toggle('on', e==='dxb');
  buildMatrix();   /* the matrix is per emirate, so it is rebuilt, not just re-styled */
  render();        /* and any open answer card re-prices against the other shelf */
}
bAd.addEventListener('click', function(){ setEmirate('ad'); });
bDx.addEventListener('click', function(){ setEmirate('dxb'); });

buildMatrix();
