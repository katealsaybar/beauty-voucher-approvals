/* Runbook.

   Deliberately almost nothing. Every other page in this pack hides detail behind a hover or a
   click, which is right for a review document and wrong for this one: if you are reading this
   page, something is failing and you should not have to discover anything. So the content is
   all in the markup and this file only marks where you are.

   The one behaviour: the jump nav highlights the section you are in, because the page is long
   and the four sections are ordered by urgency rather than by topic, so "which one am I in"
   is a real question. */
(function(){

  var links = [].slice.call(document.querySelectorAll('.jump a'));
  if(!links.length) return;

  var sections = links
    .map(function(a){ return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  /* Header height plus a little, so a section counts as "current" once its heading clears the
     sticky bar rather than once its last pixel does. */
  function offset(){
    var top = document.querySelector('.top');
    return (top ? top.offsetHeight : 0) + 24;
  }

  function mark(){
    var line = offset();
    var current = sections[0];
    sections.forEach(function(s){
      if(s.getBoundingClientRect().top <= line) current = s;
    });
    links.forEach(function(a){
      a.classList.toggle('on', a.getAttribute('href') === '#' + current.id);
    });
  }

  /* rAF rather than a raw scroll handler: this runs on every scroll event and the page is long
     enough that reading four bounding rects per event is worth coalescing. */
  var queued = false;
  window.addEventListener('scroll', function(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(function(){ queued = false; mark(); });
  }, {passive:true});

  window.addEventListener('resize', mark);
  mark();
})();
