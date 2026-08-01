(function(){
  var bar=document.getElementById('navbar');
  if(!bar) return;

  /* пилюля статуса есть только на главной — на кейсе её нет, и этот блок
     остаётся неактивным. Тот же паттерн «проверил элемент — вышли», что и во
     всех остальных модулях. */
  var pill=document.getElementById('statusPill');

  var last=window.pageYOffset||0, ticking=false;
  var DELTA=8, TOP_SAFE=90;

  /* скрыта ли пилюля по скроллу (повторяет поведение навбара) */
  var pillScrollHidden=false;
  /* скрыта ли пилюля тем, что visitor в зоне «Обо мне» */
  var pillInAbout=false;

  function applyPill(){
    if(!pill) return;
    /* два независимых триггера склеиваются через ИЛИ: пилюля прячется, если
       спрятана по скроллу ИЛИ если посетитель дошёл до «Обо мне» */
    if(pillScrollHidden||pillInAbout) pill.classList.add('hidden');
    else pill.classList.remove('hidden');
  }

  function update(){
    var y=window.pageYOffset||0;
    var diff=y-last;

    if(y<=TOP_SAFE){
      bar.classList.remove('hidden');
      if(pill){ pillScrollHidden=false; applyPill(); }
    } else if(Math.abs(diff)>DELTA){
      if(diff>0){ bar.classList.add('hidden'); if(pill){ pillScrollHidden=true; applyPill(); } }
      else { bar.classList.remove('hidden'); if(pill){ pillScrollHidden=false; applyPill(); } }
    }
    last=y;
    ticking=false;
  }

  window.addEventListener('scroll',function(){
    if(!ticking){ ticking=true; requestAnimationFrame(update); }
  },{passive:true});

  /* при фокусе с клавиатуры навбар и пилюля всегда показаны */
  bar.addEventListener('focusin',function(){ bar.classList.remove('hidden'); });
  if(pill){
    pill.addEventListener('focusin',function(){
      pillScrollHidden=false; pillInAbout=false; applyPill();
    });
  }

  /* зона «Обо мне»: пока секция в viewport, пилюля скрыта — там статус уже
     избыточен (ниже лежат контакты, и приземление читается сильнее без
     второй плашки). threshold 0 + rootMargin, чтобы скрытие срабатывало,
     как только верхний край about показался на экране. */
  var about=document.getElementById('about');
  if(pill && about && 'IntersectionObserver' in window){
    new IntersectionObserver(function(e){
      pillInAbout=e[0].isIntersecting;
      applyPill();
    },{threshold:0,rootMargin:'-40px 0px -60% 0px'}).observe(about);
  }

  /* раскрытие фактов на мобиле: тап по статусу показывает «Самара · 25».
     На десктопе детали и так видны, поэтому переключение безвредно. Закрытие
     — повторным тапом или кликом вне пилюли. */
  if(pill){
    var head=pill.querySelector('.statuspill__head');
    if(head){
      head.addEventListener('click',function(e){
        e.stopPropagation();
        var open=pill.classList.toggle('statuspill--open');
        head.setAttribute('aria-expanded',open?'true':'false');
      });
      document.addEventListener('click',function(e){
        if(pill.classList.contains('statuspill--open') && !pill.contains(e.target)){
          pill.classList.remove('statuspill--open');
          head.setAttribute('aria-expanded','false');
        }
      });
    }
  }
})();
