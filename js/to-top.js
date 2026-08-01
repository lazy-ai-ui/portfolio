/* Кнопка «Наверх»: появляется, когда позади больше экрана с небольшим запасом,
   и уезжает обратно у верха страницы. */
(function(){
  var btn=document.getElementById('toTop');
  if(!btn) return;

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var shown=false, ticking=false;

  function update(){
    ticking=false;
    var need=(window.pageYOffset||0) > window.innerHeight*1.2;
    if(need===shown) return;
    shown=need;
    btn.classList.toggle('on',need);
    /* спрятанную кнопку убираем и из обхода с клавиатуры */
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
    /* возвращаем фокус в начало страницы, иначе он остаётся на кнопке внизу */
    var first=document.querySelector('.navbar a, .navbar button');
    if(first) first.focus({preventScroll:true});
  });

  update();
})();
