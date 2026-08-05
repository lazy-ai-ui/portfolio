/* Кромка страницы: линейка, которая не досыпалась.

   Первый экран собирает структуру из хаоса, карточка «в работе» её роняет —
   а низ страницы остаётся недособранным. Разваливается при этом не абстрактная
   полоса частиц, а та самая пунктирная линейка, которой на сайте разделены
   секции: шаг 12px, штрих 5px, прозрачность 0.30 — цифры взяты из .rule
   один в один. Верхний ряд неотличим от неё, ниже структура редеет, а
   отдельные квадраты отрываются и медленно уходят вниз, растворяясь.

   Архитектура та же, что у остальных канвасов проекта: пул объектов без
   аллокаций в кадре, лерп с независимым от частоты кадров коэффициентом,
   пауза вне поля зрения, статичный кадр для prefers-reduced-motion. */
(function(){
  var cv=document.getElementById('edgefig'); if(!cv) return;
  var ctx=cv.getContext('2d');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* геометрия .rule: штрих 5px, период 12px, тон rgba(11,11,12,.30) */
  var STEP=12, UNIT=5, TOP=0.30;
  /* сколько рядов участвует в осыпании и какая доля клеток в каждом жива */
  var KEEP=[1,0.62,0.34,0.17,0.08,0.03];

  var W=0,H=0,dpr=1,cells=[],drops=[],nowT=0;

  function build(){
    cells=[];
    var n=Math.ceil(W/STEP);
    for(var r=0;r<KEEP.length;r++){
      for(var i=0;i<n;i++){
        /* Верхний ряд сплошной — это и есть линейка. Ниже клетка появляется
           с убывающей вероятностью, поэтому край выглядит осыпающимся, а не
           нарисованным градиентом. */
        if(Math.random()>KEEP[r]) continue;
        cells.push({
          x:i*STEP, y:r*STEP, row:r,
          /* тон гаснет вглубь: нижние остатки структуры бледнее */
          o:TOP*(1-r*0.13),
          on:true, back:0
        });
      }
    }

    /* пул падающих: создаётся один раз, дальше только переиспользуется */
    if(!drops.length){
      for(var d=0;d<44;d++) drops.push({live:false,x:0,y:0,vy:0,sz:UNIT,rot:0,rs:0,o:0,ph:0});
    } else {
      for(var k=0;k<drops.length;k++) drops[k].live=false;
    }
  }

  function size(){
    var r=cv.getBoundingClientRect();
    W=Math.max(1,r.width); H=Math.max(1,r.height);
    dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.floor(W*dpr); cv.height=Math.floor(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    build();
  }

  /* Отрыв: живая клетка гаснет, на её месте начинается падение, а сама
     клетка возвращается через несколько секунд. Плотность кромки за счёт
     этого держится сама, без пересборки. */
  function detach(){
    if(!cells.length) return;
    for(var n=0;n<20;n++){
      var c=cells[Math.floor(Math.random()*cells.length)];
      /* верхний ряд не трогаем: линейка должна остаться линейкой */
      if(!c.on||c.row===0) continue;
      var d=null;
      for(var i=0;i<drops.length;i++) if(!drops[i].live){ d=drops[i]; break; }
      if(!d) return;
      c.on=false; c.back=nowT+2.4+Math.random()*3.2;
      d.live=true; d.x=c.x; d.y=c.y; d.o=c.o;
      d.vy=3+Math.random()*7;
      d.sz=UNIT; d.rot=0; d.rs=(Math.random()-0.5)*0.5;
      d.ph=Math.random()*Math.PI*2;
      return;
    }
  }

  function frame(t,dt){
    nowT=t;
    ctx.clearRect(0,0,W,H);

    var i,c,d;
    for(i=0;i<cells.length;i++){
      c=cells[i];
      if(!c.on){
        if(c.back&&t>c.back){ c.on=true; c.back=0; }
        continue;
      }
      ctx.fillStyle='rgba(11,11,12,'+c.o.toFixed(3)+')';
      ctx.fillRect(c.x,c.y,UNIT,UNIT);
    }

    for(i=0;i<drops.length;i++){
      d=drops[i];
      if(!d.live) continue;
      /* Падение очень медленное и с малым ускорением: это не гравитация,
         а оседание. Ускорения и отскока здесь быть не должно. */
      d.vy+=22*dt;
      d.y+=d.vy*dt;
      d.x+=Math.sin(t*0.5+d.ph)*0.18;
      d.rot+=d.rs*dt;

      /* чем глубже, тем прозрачнее: квадрат не долетает до низа, а тает */
      var k=1-d.y/H;
      if(k<=0){ d.live=false; continue; }
      var a=d.o*k*k;
      if(a<0.006){ d.live=false; continue; }

      ctx.fillStyle='rgba(11,11,12,'+a.toFixed(3)+')';
      if(Math.abs(d.rot)<0.02){
        ctx.fillRect(d.x,d.y,d.sz,d.sz);
      } else {
        ctx.save();
        ctx.translate(d.x+d.sz/2,d.y+d.sz/2);
        ctx.rotate(d.rot);
        ctx.fillRect(-d.sz/2,-d.sz/2,d.sz,d.sz);
        ctx.restore();
      }
    }
  }

  var rt;
  window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(size,180);});

  size();

  if(reduce){
    for(var i=0;i<cells.length;i++){
      ctx.fillStyle='rgba(11,11,12,'+cells[i].o.toFixed(3)+')';
      ctx.fillRect(cells[i].x,cells[i].y,UNIT,UNIT);
    }
    return;
  }

  var startTs=null,prevTs=null,running=false,rafId=0,visible=false,lastT=0,detT=0;

  function loop(ts){
    /* время продолжается с того места, где остановилось: иначе сроки
       возврата клеток окажутся в будущем, до которого счётчик уже не дойдёт */
    if(startTs===null){ startTs=ts-lastT*1000; prevTs=ts; }
    var dt=Math.min(0.05,(ts-prevTs)/1000);
    prevTs=ts;
    lastT=(ts-startTs)/1000;
    frame(lastT,dt);
    rafId=requestAnimationFrame(loop);
  }
  function start(){
    if(running) return;
    running=true; prevTs=null; startTs=null;
    detT=setInterval(detach,900);
    rafId=requestAnimationFrame(loop);
  }
  function stop(){
    if(!running) return;
    running=false;
    cancelAnimationFrame(rafId);
    clearInterval(detT);
  }
  function sync(){ (visible&&!document.hidden)?start():stop(); }

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(e){
      visible=e[0].isIntersecting; sync();
    },{threshold:0}).observe(cv);
  } else {
    visible=true; sync();
  }
  document.addEventListener('visibilitychange',sync);
})();
