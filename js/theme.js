/* Тема.

   Состояний три, а не два: «как в системе», светлая и тёмная. Системное —
   не то же самое, что светлое: пока пользователь его не трогал, страница
   должна ехать за настройкой устройства, в том числе если та переключается
   по расписанию. Кнопка ходит по кругу система → светлая → тёмная → система.

   Сам атрибут ставит короткий инлайновый скрипт в <head> каждой страницы:
   если ждать загрузки этого файла, страница успевает мигнуть светлым. Здесь
   живёт остальное — слежение за системной настройкой, кнопка, анимация смены
   и чтение каналов палитры для канвасов.

   Канвасы рисуют частицы тысячами за кадр, поэтому getComputedStyle на каждую
   точку недопустим. Каналы читаются один раз и обновляются по событию
   theme:change — на него подписаны все канвасы. */
(function(){
  var root=document.documentElement;
  var mq=window.matchMedia('(prefers-color-scheme: dark)');
  var reduceMq=window.matchMedia('(prefers-reduced-motion: reduce)');
  var KEY='theme';
  var cache={};
  var fadeT=0;

  /* Порядок обхода. Светлая перед тёмной, потому что от системной чаще уходят
     в неё же, а возврат к системной стоит последним: это не «ещё одна тема»,
     а отказ от выбора. */
  var ORDER=['system','light','dark'];

  function stored(){
    try{ return localStorage.getItem(KEY); }catch(e){ return null; }
  }

  function mode(){
    var m=stored();
    return m==='dark'||m==='light'?m:'system';
  }

  function resolve(m){
    return m==='system'?(mq.matches?'dark':'light'):m;
  }

  function paintMeta(){
    var bg=getComputedStyle(root).getPropertyValue('--bg').trim();
    var tags=document.querySelectorAll('meta[name="theme-color"]');
    for(var i=0;i<tags.length;i++) tags[i].setAttribute('content',bg);
  }

  /* Кнопка подписывается действием, а не состоянием: «включить тёмную» — это
     то, что произойдёт по нажатию, и скринридер читает её так же, как видящий
     читает иконку. Возврат к системной назван возвратом, иначе непонятно, чем
     третье нажатие отличается от первого. */
  var SAY={system:'Вернуть системную тему',light:'Включить светлую тему',dark:'Включить тёмную тему'};

  function label(){
    var m=mode();
    var next=ORDER[(ORDER.indexOf(m)+1)%ORDER.length];
    var b=document.querySelectorAll('[data-theme-toggle]');
    for(var i=0;i<b.length;i++) b[i].setAttribute('aria-label',SAY[next]);

    /* У сегментов подпись постоянная, меняется только нажатость. Раскрытие и
       выбранный сегмент рисует CSS по атрибуту на <html> — до первой
       отрисовки; aria-pressed нужен разметке для тех, кто читает её ушами. */
    var s=document.querySelectorAll('[data-theme-set]');
    for(var j=0;j<s.length;j++){
      s[j].setAttribute('aria-pressed',s[j].getAttribute('data-theme-set')===m?'true':'false');
    }
  }

  /* Сама подмена. Всё, что меняет вид страницы, должно уложиться сюда
     синхронно: под View Transitions браузер снимает новый кадр сразу после
     возврата из этой функции, и всё, что не успело перерисоваться, попадёт в
     снимок старым. Именно поэтому канвасы перерисовываются по theme:change
     тут же, а не на следующем кадре. */
  function apply(m){
    try{
      if(m==='system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY,m);
    }catch(e){}
    root.setAttribute('data-theme-mode',m);
    root.setAttribute('data-theme',resolve(m));
    cache={};
    paintMeta();
    label();
    root.dispatchEvent(new CustomEvent('theme:change',{detail:{theme:resolve(m),mode:m}}));
  }

  /* Точка, из которой расходится новый свет, — центр нажатой кнопки. Радиус
     считается до самого дальнего угла окна: возьми меньше, и круг остановится,
     не дойдя до края, оставив в кадре полосу старой темы. */
  function origin(el){
    var w=innerWidth,h=innerHeight,x=w/2,y=h/2;
    if(el&&el.getBoundingClientRect){
      var b=el.getBoundingClientRect();
      x=b.left+b.width/2; y=b.top+b.height/2;
    }
    var r=Math.sqrt(Math.pow(Math.max(x,w-x),2)+Math.pow(Math.max(y,h-y),2));
    root.style.setProperty('--tt-x',x+'px');
    root.style.setProperty('--tt-y',y+'px');
    root.style.setProperty('--tt-r',r+'px');
  }

  function animate(m,el){
    /* Смена режима не всегда меняет картинку: уйти с системной на светлую при
       светлой системе — это только смена иконки. Гнать ради неё полноэкранный
       переход незачем. */
    if(resolve(m)===root.getAttribute('data-theme')||reduceMq.matches){ apply(m); return; }
    origin(el);

    if(!document.startViewTransition){
      root.classList.add('tt-fade');
      apply(m);
      clearTimeout(fadeT);
      fadeT=setTimeout(function(){ root.classList.remove('tt-fade'); settleHover(); },900);
      return;
    }

    root.classList.add('tt');
    var t=document.startViewTransition(function(){ apply(m); });
    var done=function(){ root.classList.remove('tt'); settleHover(); };

    /* Браузер пропускает переход, когда снимок снять не с чего: вкладка в
       фоне, уже идёт другой переход, страница уходит по ссылке. Тема при этом
       всё равно меняется — отваливается только анимация. Отказ надо принять
       явно, иначе он улетает в консоль как необработанный reject. */
    var hush=function(){};
    if(t.ready&&t.ready.catch) t.ready.catch(hush);
    if(t.updateCallbackDone&&t.updateCallbackDone.catch) t.updateCallbackDone.catch(hush);
    t.finished.then(done,done);
  }

  /* Системную настройку слушаем только пока пользователь не выбрал сам:
     свой выбор старше системного. */
  var onSystem=function(){ if(mode()==='system') animate('system',null); };
  if(mq.addEventListener) mq.addEventListener('change',onSystem);
  else if(mq.addListener) mq.addListener(onSystem);

  /* Пилюля не должна сворачиваться, пока курсор внутри неё. На один :hover
     положиться нельзя: смена темы идёт под View Transitions, живой документ на
     полсекунды подменяется снимком, и после возврата :hover не восстановлен,
     пока мышь не двинулась — пилюля схлопывалась прямо под курсором. Наведение
     поэтому помним классом, уход, случившийся во время перехода, пропускаем, а
     после перехода сверяемся с настоящим :hover. */
  function hovers(){ return document.querySelectorAll('.themectl'); }

  function settleHover(){
    var c=hovers();
    for(var i=0;i<c.length;i++){
      if(!c[i].matches(':hover')) c[i].classList.remove('is-open');
    }
  }

  function wireHover(){
    var c=hovers();
    for(var i=0;i<c.length;i++){
      c[i].addEventListener('pointerenter',function(){ this.classList.add('is-open'); });
      c[i].addEventListener('pointerleave',function(){
        if(!root.classList.contains('tt')) this.classList.remove('is-open');
      });
    }
  }

  function wire(){
    var b=document.querySelectorAll('[data-theme-toggle]');
    for(var i=0;i<b.length;i++){
      b[i].addEventListener('click',function(){ window.Theme.cycle(this); });
    }
    var s=document.querySelectorAll('[data-theme-set]');
    for(var j=0;j<s.length;j++){
      s[j].addEventListener('click',function(){
        window.Theme.set(this.getAttribute('data-theme-set'),this);
      });
    }
    wireHover();
    label();
  }

  window.Theme={
    /* get — что видно на экране, mode — что выбрал пользователь. */
    get:function(){ return root.getAttribute('data-theme')==='dark'?'dark':'light'; },
    mode:mode,
    /* from — элемент, из которого расходится свет; без него круг идёт из
       центра окна (например, когда тему меняют из консоли). */
    set:function(m,from){ animate(ORDER.indexOf(m)<0?'system':m,from); },
    cycle:function(from){ this.set(ORDER[(ORDER.indexOf(mode())+1)%ORDER.length],from); },
    /* Канал палитры строкой «r,g,b» — так его подставляют прямо в rgba(). */
    channel:function(name,fallback){
      if(cache[name]===undefined){
        cache[name]=getComputedStyle(root).getPropertyValue(name).trim()||fallback;
      }
      return cache[name];
    },
    /* Тот же канал числами — когда цвет надо смешивать, а не печатать. */
    rgb:function(name,fallback){
      var p=this.channel(name,fallback).split(',');
      return [+p[0]||0,+p[1]||0,+p[2]||0];
    },
    onChange:function(fn){ root.addEventListener('theme:change',fn); }
  };

  paintMeta();

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire);
  else wire();
})();
