  var links = Array.prototype.slice.call(document.querySelectorAll('#nav a'));
  var map = {};
  links.forEach(function(a){ map[a.getAttribute('href').slice(1)] = a; });
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        links.forEach(function(l){ l.classList.remove('active'); });
        if(map[e.target.id]) map[e.target.id].classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  document.querySelectorAll('main section').forEach(function(s){ obs.observe(s); });

  /* Where a note can be pinned. Setting this replaces the widget's defaults, so the three
     defaults are repeated here and the sub-heading row is the addition: every h3 inside a
     section is its own note target, so "the six lines" and "rules and safeguards" can be
     commented on separately instead of everything landing on the parent section. */
  window.TRS_PIN_TARGETS = [
    { sel: 'main section[id]',  into: '.sec-head', labelSel: 'h2',     float: false },
    { sel: 'main section[id] h3', into: null,      labelSel: null,     float: false },
    { sel: 'ol.terms > li',    into: null,         labelSel: 'strong', float: true  },
    { sel: '.decision',        into: null,         labelSel: '.q',     float: true  }
  ];
