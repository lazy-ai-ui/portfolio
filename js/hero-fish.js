/* Косяк рыбок на первом экране.

   Исходник — p5.js-миниатюра в golf-формате: одна строка на функцию точки и
   одна на draw. Здесь она разложена в обычный Canvas 2D без p5. Формулы
   сохранены один в один, поменялись только оболочка и то, что раньше делал
   за нас фреймворк: свой цикл кадров, DPR, ресайз и центровка.

   Узор строится в своей системе координат 400×400 (как в оригинале) и потом
   вписывается в канвас целиком: так пропорции не плывут ни на широком мониторе,
   ни на телефоне.
*/
(function(){
  var cv=document.getElementById('fig'); if(!cv) return;
  var ctx=cv.getContext('2d');
  var hero=cv.closest('.hero')||cv.parentNode;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CX=200,CY=195;            /* центр вращения косяка внутри квадрата */
  var W=0,H=0,dpr=1,raf=0,visible=true;
  var t=0;

  /* Тон линий берётся из палитры: на светлой теме чернильный, на тёмной
     светлый. Иначе точки исчезали бы на фоне при переключении темы. */
  var INK=Theme.channel('--ink-rgb','11,11,12');
  Theme.onChange(function(){ INK=Theme.channel('--ink-rgb','11,11,12'); if(reduce) frame(); });

  /* Точек тем меньше, чем меньше экран: на телефоне десять тысяч точек за кадр
     упираются в кадровый бюджет, а разница на глаз почти не видна. */
  function count(){
    var w=window.innerWidth;
    if(w<600) return 3500;
    if(w<1000) return 6500;
    return 10000;
  }
  var N=count();

  function size(){
    var r=cv.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=Math.max(1,Math.round(r.width)); H=Math.max(1,Math.round(r.height));
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    N=count();
  }

  function frame(){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);

    /* Косяк кружит вокруг точки (200,195) и за оборот выходит примерно в
       260×390 исходных единиц. Вписываем именно этот размах, а не квадрат
       400×400: квадрат наполовину пустой, и узор из-за него выходил мелким.
       Центр берём тот же, вокруг которого идёт вращение, иначе на части кадров
       косяк уезжает за край — его видимый центр тяжести гуляет вместе с t. */
    var s=Math.min(W/290,H/420);
    ctx.translate(W/2-CX*s, H/2-CY*s);
    ctx.scale(s,s);

    ctx.fillStyle='rgba('+INK+',0.45)';
    var px=1/(s*dpr)*dpr;          /* точка держит примерно один экранный пиксель */
    if(px<0.35) px=0.35;

    for(var i=N;i--;){
      var y=i/(N/33.9);            /* тот же диапазон y, что и при 10000 точек */
      var k=(5+Math.pow(Math.sin(y*2-t/2),2))*Math.cos(i/29);
      var e=y/7-13;
      var d=Math.sqrt(k*k+e*e)-6;
      var q=3*Math.sin(k*2)+Math.cos(y)/k+Math.sin(y/25)*k*(9+4*Math.sin(e*9-d*3+t*2));
      var c=d-t;
      ctx.fillRect(q+50*Math.cos(c)+200, q*Math.sin(c)+d*39, px, px);
    }
  }

  function loop(){
    raf=0;
    t+=Math.PI/240*0.7;      /* на 30% медленнее исходной миниатюры */
    frame();
    if(visible && !reduce) raf=requestAnimationFrame(loop);
  }
  function start(){ if(!raf && visible && !reduce) raf=requestAnimationFrame(loop); }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf=0; } }

  /* Пока первый экран прокручен, считать кадры незачем — узор всё равно никто
     не видит, а батарея на нём тратится вполне настоящая. */
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      visible=es[0].isIntersecting;
      if(visible) start(); else stop();
    },{threshold:0}).observe(hero);
  }
  document.addEventListener('visibilitychange',function(){
    if(document.hidden) stop(); else start();
  });

  var rt=0;
  window.addEventListener('resize',function(){
    clearTimeout(rt); rt=setTimeout(function(){ size(); frame(); },120);
  });

  size();
  frame();                         /* при reduce-motion остаётся один кадр */
  start();
})();
