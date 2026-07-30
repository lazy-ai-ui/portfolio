(function(){
  var box=document.getElementById('secnav');
  if(!box) return;
  var links=[].slice.call(box.querySelectorAll('a'));
  var sections=links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  var current=-1;

  function setActive(i){
    if(i===current||i<0) return;
    current=i;
    links.forEach(function(a,n){ a.classList.toggle('active', n===i); });
    var a=links[i];
    var l=a.offsetLeft, w=a.offsetWidth;
    if(l < box.scrollLeft || l+w > box.scrollLeft+box.clientWidth){
      box.scrollTo({left:Math.max(0,l-16), behavior:'smooth'});
    }
  }

  if('IntersectionObserver' in window){
    var visible={};
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var i=sections.indexOf(e.target);
        if(i>-1) visible[i]=e.isIntersecting?e.intersectionRatio:0;
      });
      var best=-1,bv=0;
      for(var k in visible){ if(visible[k]>bv){ bv=visible[k]; best=+k; } }
      if(best>-1) setActive(best);
    },{rootMargin:'-20% 0px -45% 0px',threshold:[0,.15,.35,.6,1]});
    sections.forEach(function(s){ if(s) io.observe(s); });
  }
  setActive(0);
})();
