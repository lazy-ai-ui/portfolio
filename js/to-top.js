/* Кнопка «Наверх»: на страницах кейсов появляется только когда долистан
   раздел «Итог» (#result), а не от абстрактной высоты экрана. */
(function(){
  var btn=document.getElementById('toTop');
  if(!btn) return;

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var target=document.getElementById('result');
  var shown=false, ticking=false;

  function update(){
    ticking=false;
    if(!target) return;
    var need=target.getBoundingClientRect().top <= window.innerHeight;
    if(need===shown) return;
    shown=need;
    btn.classList.toggle('on',need);
    btn.tabIndex = need ? 0 : -1;
    btn.setAttribute('aria-hidden', need ? 'false' : 'true');
  }

  window.addEventListener('scroll',function(){
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(update);
  },{passive:true});

  btn.addEventListener('click',function(){
    window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'});
    var first=document.querySelector('.navbar a, .navbar button');
    if(first) first.focus({preventScroll:true});
  });

  update();
})();
