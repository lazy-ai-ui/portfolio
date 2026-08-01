(function(){
  var box=document.getElementById('secnav');
  if(!box) return;
  var links=[].slice.call(box.querySelectorAll('a'));
  var sections=links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  var current=-1;

  /* подложка активного пункта, которая переезжает вместо перекраски */
  var pill=document.createElement('span');
  pill.className='secnav__pill no-anim';
  pill.setAttribute('aria-hidden','true');
  box.insertBefore(pill,box.firstChild);

  function movePill(){
    var a=links[current];
    if(!a) return;
    pill.style.width=a.offsetWidth+'px';
    pill.style.transform='translateX('+a.offsetLeft+'px)';
    pill.classList.add('on');
  }

  function setActive(i){
    if(i===current||i<0) return;
    current=i;
    links.forEach(function(a,n){ a.classList.toggle('active', n===i); });
    movePill();
    var a=links[i];
    var l=a.offsetLeft, w=a.offsetWidth;
    if(l < box.scrollLeft || l+w > box.scrollLeft+box.clientWidth){
      box.scrollTo({left:Math.max(0,l-16), behavior:'smooth'});
    }
  }

  /* ширина пунктов зависит от шрифта — пересчитываем, когда он подгрузился
     и при смене размеров окна */
  var rt;
  window.addEventListener('resize',function(){
    clearTimeout(rt);
    pill.classList.add('no-anim');
    rt=setTimeout(function(){ movePill(); pill.classList.remove('no-anim'); },120);
  });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(movePill);

  /* Пока идёт плавная прокрутка по клику, наблюдатель молчит: иначе пилюля
     проедет по всем разделам, мимо которых летит страница, и переход будет
     выглядеть рваным вместо одного движения. */
  var lock=0;
  links.forEach(function(a,i){
    a.addEventListener('click',function(){
      lock=Date.now()+900;
      setActive(i);
    });
  });

  if('IntersectionObserver' in window){
    var visible={};
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var i=sections.indexOf(e.target);
        if(i>-1) visible[i]=e.isIntersecting?e.intersectionRatio:0;
      });
      if(Date.now()<lock) return;
      var best=-1,bv=0;
      for(var k in visible){ if(visible[k]>bv){ bv=visible[k]; best=+k; } }
      if(best>-1) setActive(best);
    },{rootMargin:'-20% 0px -45% 0px',threshold:[0,.15,.35,.6,1]});
    sections.forEach(function(s){ if(s) io.observe(s); });
  }
  setActive(0);
  /* включаем анимацию уже после того, как пилюля встала на место.
     setTimeout, а не rAF: в фоновой вкладке кадры не идут, и переход
     остался бы выключенным навсегда */
  setTimeout(function(){ pill.classList.remove('no-anim'); },80);
})();
