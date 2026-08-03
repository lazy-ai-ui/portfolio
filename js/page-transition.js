/* Переход между страницами: пространство втягивается в точку клика, новый
   экран рождается из неё же.

   Подключается в <head> без defer — намеренно. Модуль должен успеть поставить
   полотно и координаты до первой отрисовки: иначе на запасном пути новая
   страница мигнёт целиком за кадр до того, как её закроют.

   Ничего в разметке навигации не меняется. Ссылки остаются обычными <a href>,
   и если модуль не отработал — переход просто не проигрывается. Физика и
   геометрия живут в css/transition.css, здесь только точка, хранение и запуск.
*/
(function(){
  var KEY='pt:origin';
  var root=document.documentElement;

  /* длительности продублированы числом: CSS читать до первой отрисовки нельзя
     (стили могут быть ещё не применены), а запасному пути они нужны сразу.
     Держать синхронно с --pt-out / --pt-in в css/transition.css. */
  var narrow=window.matchMedia&&window.matchMedia('(max-width: 600px)').matches;
  var OUT=narrow?420:480, IN=narrow?540:620;
  var STALE=4000;   /* точка старше — не наша навигация, анимацию не играем */

  var mq=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced(){ return !!(mq&&mq.matches); }

  /* Межстраничные VT. Наличия onpagereveal мало: встречаются сборки, где
     свойство есть, а событие не приходит — тогда переход молча не играет
     вообще. Поэтому возможность подтверждается делом: если pagereveal не
     пришёл до первой отрисовки, страница один раз помечает NOVT и дальше все
     переходы идут запасным путём. Флаг живёт в сессии, проверка разовая. */
  var NOVT='pt:novt';
  var novt=false;
  try{ novt=sessionStorage.getItem(NOVT)==='1'; }catch(e){}
  function dropVT(){
    if(novt) return;
    novt=true;
    try{ sessionStorage.setItem(NOVT,'1'); }catch(e){}
  }
  var hasVT=('onpagereveal' in window) && !!document.startViewTransition;
  if(!hasVT) dropVT();

  /* --- точка и геометрия ------------------------------------------------- */

  /* +6% запаса. На мобиле высота viewport плавает вместе с адресной строкой:
     радиус посчитан по одному её состоянию, а показан может быть при другом,
     и в углу остался бы неприкрытый кусок. Дешевле заложить запас, чем ловить
     это на конкретной прошивке. */
  function radius(x,y){
    var w=window.innerWidth, h=window.innerHeight;
    return Math.ceil(1.06*Math.max(
      Math.sqrt(x*x+y*y),
      Math.sqrt((w-x)*(w-x)+y*y),
      Math.sqrt(x*x+(h-y)*(h-y)),
      Math.sqrt((w-x)*(w-x)+(h-y)*(h-y))
    ));
  }

  /* радиус считается от viewport текущей страницы, а не переносится с
     предыдущей: окно могло измениться, и круг перестал бы накрывать углы */
  function setOrigin(x,y){
    root.style.setProperty('--pt-x',x+'px');
    root.style.setProperty('--pt-y',y+'px');
    root.style.setProperty('--pt-r',radius(x,y)+'px');
    return radius(x,y);
  }

  function save(x,y){
    try{ sessionStorage.setItem(KEY,JSON.stringify({x:x,y:y,t:Date.now()})); }catch(e){}
  }

  /* точка одноразовая: читаем и сразу стираем, иначе обновление страницы или
     возврат по «назад» проиграли бы чужой переход */
  function take(){
    try{
      var raw=sessionStorage.getItem(KEY);
      if(!raw) return null;
      sessionStorage.removeItem(KEY);
      var p=JSON.parse(raw);
      if(!p||typeof p.x!=='number'||Date.now()-p.t>STALE) return null;
      return p;
    }catch(e){ return null; }
  }

  /* --- запасной путь: полотно с дыркой ----------------------------------- */

  /* Кривые те же, что в CSS, но заданные функцией: в rAF-цикле нужен не набор
     сэмплов, а само значение. Закрытие — быстро и затухает у точки, раскрытие
     — почти стоит на месте, потом разгоняется, в конце мягкая посадка. */
  function easeOut(t){ return 1-Math.pow(1-t,3.8); }
  function easeIn(t){
    var a=Math.pow(t,3.8);
    if(t<=.75) return a;
    var s=(t-.75)/.25, w=s*s*(3-2*s);
    return a*(1-w)+(1-Math.pow(1-t,1.8))*w;
  }

  function hole(v){ root.style.setProperty('--pt-hole',v+'px'); }

  /* rAF + предохранитель по таймеру: если вкладку увели в фон, кадры не идут,
     и переход завис бы навсегда — тот же приём, что в остальных модулях. */
  var running=false;
  function run(ms, from, to, ease, done){
    var start=0, fired=false;
    running=true;
    function end(){ if(fired) return; fired=true; running=false; hole(to); done(); }
    function step(ts){
      if(!start) start=ts;
      var p=Math.min(1,(ts-start)/ms);
      hole(from+(to-from)*ease(p));
      if(p<1&&!fired) requestAnimationFrame(step); else end();
    }
    requestAnimationFrame(step);
    setTimeout(end, ms+260);
  }

  function veilClose(x,y,done){
    var r=setOrigin(x,y);
    hole(r);
    root.classList.add('pt-cover');
    /* один синхронный reflow: без него стартовое значение маски и конечное
       попадают в один кадр, и дырка схлопывается мгновенно */
    void root.offsetWidth;
    run(OUT, r, 0, easeOut, done);
  }

  function veilOpen(x,y){
    var r=setOrigin(x,y);
    hole(0);
    root.classList.add('pt-cover');
    void root.offsetWidth;
    run(IN, 0, r, easeIn, function(){
      root.classList.remove('pt-cover');
      root.style.removeProperty('--pt-hole');
    });
  }

  /* --- вход на страницу --------------------------------------------------- */

  if(!reduced()){
    var pending=null;
    try{ pending=JSON.parse(sessionStorage.getItem(KEY)||'null'); }catch(e){}
    if(pending&&(typeof pending.x!=='number'||Date.now()-pending.t>STALE)) pending=null;

    /* Пришли по нашей ссылке: закрываем страницу полотном прямо сейчас, ещё до
       первой отрисовки. Дальше одно из двух — либо pagereveal успевает снять
       полотно и отдать движение снимкам VT, либо полотно само раскрывается из
       точки. Так между кадром «страница целиком» и началом раскрытия нет
       промежутка, в котором можно увидеть неанимированный экран. */
    if(pending&&!novt){
      hole(0);
      root.classList.add('pt-cover');
    }

    if(hasVT){
      /* Псевдоэлементы перехода живут в новом документе, поэтому и координаты
         ставим здесь — на старой странице их ставить бессмысленно.
         pagereveal приходит до первой отрисовки, поэтому снятое здесь полотно
         в снимок VT не попадает. */
      window.addEventListener('pagereveal',function(e){
        root.classList.remove('pt-cover');
        var p=take();
        if(!p){ if(e.viewTransition) e.viewTransition.skipTransition(); return; }
        setOrigin(p.x,p.y);
        if(!e.viewTransition){ veilOpen(p.x,p.y); return; }
        root.classList.add('pt-nav');
        e.viewTransition.finished.then(function(){ root.classList.remove('pt-nav'); },
                                       function(){ root.classList.remove('pt-nav'); });
      });
      /* Уход со страницы без нашей точки — «назад», «вперёд», отправка формы:
         анимировать нечего, играть переход из случайного места нельзя. */
      window.addEventListener('pageswap',function(e){
        var has=false;
        try{ has=!!sessionStorage.getItem(KEY); }catch(err){}
        if(!has){ if(e.viewTransition) e.viewTransition.skipTransition(); return; }
        /* точка есть, а перехода браузер не завёл — значит VT здесь не
           работают, следующий уход пойдёт запасным путём */
        if(!e.viewTransition) dropVT();
      });
    }

    /* Проверка делом: к этому моменту pagereveal обязан был отработать и
       забрать точку. Если она на месте — событие не пришло, VT в этом браузере
       считаем неработающими и раскрываем полотном. */
    var settle=function(){
      var p=take();
      if(!p){ root.classList.remove('pt-cover'); return; }
      dropVT();
      veilOpen(p.x,p.y);
    };
    if(pending){
      if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',settle);
      else settle();
    }

    /* последняя страховка: полотно не должно пережить страницу ни при каком
       отказе выше — иначе сайт останется закрашенным наглухо */
    setTimeout(function(){
      if(root.classList.contains('pt-cover')&&!running) root.classList.remove('pt-cover');
    },2000);
  }

  /* --- уход со страницы --------------------------------------------------- */

  function internal(a){
    if(!a||!a.href) return false;
    if(a.target&&a.target!=='_self') return false;
    if(a.hasAttribute('download')) return false;
    if(a.origin!==location.origin) return false;
    /* якорь внутри текущей страницы — это прокрутка, а не переход */
    if(a.pathname===location.pathname&&a.search===location.search&&a.hash) return false;
    if(a.pathname===location.pathname&&a.search===location.search) return false;
    return true;
  }

  var busy=false;

  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;

    var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
    if(!internal(a)) return;
    if(reduced()) return;

    if(busy){ e.preventDefault(); return; }

    /* Клавиатура: события Enter приходят с нулевыми координатами. Берём центр
       самой ссылки — это по-прежнему точка, на которую человек смотрит, а не
       середина экрана. */
    var x=e.clientX, y=e.clientY;
    if(!x&&!y){
      var r=a.getBoundingClientRect();
      x=r.left+r.width/2; y=r.top+r.height/2;
    }
    x=Math.max(0,Math.min(window.innerWidth,x));
    y=Math.max(0,Math.min(window.innerHeight,y));

    save(x,y);
    busy=true;
    root.classList.add('pt-busy');

    /* С межстраничными VT уходим штатно: браузер сам снимет кадр и проиграет
       схлопывание по css/transition.css. Перехватывать переход руками здесь
       нельзя — снимок делается только на настоящей навигации. */
    if(hasVT&&!novt) return;

    e.preventDefault();
    var href=a.href;
    veilClose(x,y,function(){ location.href=href; });
  },false);

  /* Возврат из bfcache: страница показывается как была, полотно и блокировка
     могли остаться от прошлого ухода — снимаем. */
  window.addEventListener('pageshow',function(e){
    if(!e.persisted) return;
    busy=false;
    root.classList.remove('pt-busy');
    root.classList.remove('pt-cover');
    root.classList.remove('pt-nav');
    root.style.removeProperty('--pt-hole');
  });
})();
