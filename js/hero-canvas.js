(function(){
  var cv=document.getElementById('fig'),ctx=cv.getContext('2d');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W=0,H=0,dpr=1,P=[],assembled=false;
  var LAYOUTS=[],current=0;

  var DEFS=[
    {
      name:'dashboard', ratio:0.62, unitDiv:68, accent:[3],
      phrase:'Превращаю сложные сценарии в понятные интерфейсы',
      blocks:[
        [0.06,0.05,0.88,0.09],
        [0.06,0.19,0.20,0.76],
        [0.30,0.19,0.30,0.20],
        [0.64,0.19,0.30,0.20],
        [0.30,0.44,0.64,0.30],
        [0.30,0.79,0.30,0.16],
        [0.64,0.79,0.30,0.16]
      ]
    },
    {
      name:'phone', ratio:2.02, unitDiv:26, accent:[3],
      phrase:'Проектирую мобильные сценарии без лишних экранов',
      /* контур корпуса: доли рамки + радиус скругления в долях ширины */
      outline:[0.00,0.00,1.00,1.00,0.155],
      blocks:[
        [0.355,0.035,0.29,0.022],   /* динамический островок */
        [0.10,0.115,0.46,0.035],    /* заголовок */
        [0.10,0.20,0.80,0.155],     /* большая карточка */
        [0.10,0.395,0.36,0.085],    /* плитка (акцент) */
        [0.54,0.395,0.36,0.085],    /* плитка */
        [0.10,0.525,0.80,0.042],    /* строки списка */
        [0.10,0.592,0.80,0.042],
        [0.10,0.659,0.80,0.042],
        [0.28,0.925,0.44,0.014]     /* home indicator */
      ]
    },
    {
      name:'tablet', ratio:0.74, unitDiv:52, accent:[5],
      phrase:'Собираю системы из исследований и данных',
      outline:[0.00,0.00,1.00,1.00,0.055],
      blocks:[
        [0.06,0.07,0.88,0.055],
        [0.06,0.17,0.22,0.76],
        [0.32,0.17,0.62,0.20],
        [0.32,0.42,0.29,0.24],
        [0.65,0.42,0.29,0.24],
        [0.32,0.71,0.62,0.09],
        [0.32,0.84,0.62,0.09]
      ]
    }
  ];

  /* точки по периметру скруглённого прямоугольника с шагом step */
  function roundRectPoints(x,y,w,h,r,step){
    r=Math.min(r,w/2,h/2);
    var pts=[];
    function line(x1,y1,x2,y2){
      var d=Math.hypot(x2-x1,y2-y1);
      var n=Math.max(1,Math.round(d/step));
      for(var i=0;i<n;i++){
        var u=i/n;
        pts.push({x:x1+(x2-x1)*u, y:y1+(y2-y1)*u});
      }
    }
    function arc(cx,cy,a0,a1){
      var d=Math.abs(a1-a0)*r;
      var n=Math.max(1,Math.round(d/step));
      for(var i=0;i<n;i++){
        var a=a0+(a1-a0)*(i/n);
        pts.push({x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r});
      }
    }
    line(x+r,y,x+w-r,y);
    arc(x+w-r,y+r,-Math.PI/2,0);
    line(x+w,y+r,x+w,y+h-r);
    arc(x+w-r,y+h-r,0,Math.PI/2);
    line(x+w-r,y+h,x+r,y+h);
    arc(x+r,y+h-r,Math.PI/2,Math.PI);
    line(x,y+h-r,x,y+r);
    arc(x+r,y+r,Math.PI,Math.PI*1.5);
    return pts;
  }

  function buildLayout(def){
    var maxW=W*0.92, maxH=H*0.92;
    var w=maxW, h=w*def.ratio;
    if(h>maxH){ h=maxH; w=h/def.ratio; }
    var x0=(W-w)/2, y0=(H-h)/2;
    var unit=Math.max(W<720?8:4,Math.round(w/def.unitDiv));
    var gap=unit*1.5;
    var t=[];

    if(def.outline){
      var O=def.outline;
      var pts=roundRectPoints(x0+O[0]*w, y0+O[1]*h, O[2]*w, O[3]*h, O[4]*w, gap*0.92);
      for(var q=0;q<pts.length;q++) t.push({x:pts[q].x, y:pts[q].y, a:false, edge:true});
    }

    for(var b=0;b<def.blocks.length;b++){
      var B=def.blocks[b];
      var bx=x0+B[0]*w, by=y0+B[1]*h, bw=B[2]*w, bh=B[3]*h;
      var cx=Math.max(1,Math.floor(bw/gap)), cy=Math.max(1,Math.floor(bh/gap));
      var sx=bw/cx, sy=bh/cy;
      for(var i=0;i<cx;i++)for(var j=0;j<cy;j++){
        t.push({x:bx+sx*(i+0.5), y:by+sy*(j+0.5), a:def.accent.indexOf(b)>-1, edge:false});
      }
    }

    for(var s=t.length-1;s>0;s--){ var r2=Math.floor(Math.random()*(s+1)); var tm=t[s]; t[s]=t[r2]; t[r2]=tm; }
    return {targets:t, unit:unit};
  }

  var VPAD=130;  /* насколько поджать облако частиц сверху и снизу */

  function scatter(){
    var a=Math.random()*Math.PI*2;
    var r=Math.pow(Math.random(),0.62);
    var ry=Math.max(50,(H-VPAD*2)/2);
    return {x:W/2+Math.cos(a)*r*W*0.66, y:H/2+Math.sin(a)*r*ry*0.94};
  }

  function size(){
    dpr=Math.min(window.devicePixelRatio||1,W<720?1.5:2);
    var rc=cv.getBoundingClientRect();
    W=Math.max(1,rc.width); H=Math.max(1,rc.height);
    cv.width=Math.floor(W*dpr); cv.height=Math.floor(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    LAYOUTS=DEFS.map(buildLayout);
    var need=0;
    for(var i=0;i<LAYOUTS.length;i++) need=Math.max(need,LAYOUTS[i].targets.length);

    var base=LAYOUTS[0].unit;
    var np=[];
    for(var n=0;n<need;n++){
      var old=P[n];
      var home=scatter();
      var o=0.26+Math.random()*0.3;
      np.push({
        x:old?old.x:home.x, y:old?old.y:home.y,
        hx:home.x, hy:home.y,
        p1:Math.random()*Math.PI*2, p2:Math.random()*Math.PI*2,
        f1:0.026+Math.random()*0.034,
        f2:0.016+Math.random()*0.024,
        ax:34+Math.random()*62, ay:20+Math.random()*32,
        rot:old?old.rot:Math.random()*Math.PI, rs:(Math.random()-0.5)*0.03,
        s:base*(0.55+Math.random()*0.85),
        o:o, cur:old?old.cur:o, sz:base
      });
    }
    P=np;
  }

  function frame(t,dt){
    ctx.clearRect(0,0,W,H);
    var L=LAYOUTS[current];
    var T=L.targets, unit=L.unit, len=T.length;
    var f=dt*60;
    function ease(k){ return 1-Math.pow(1-k,f); }
    var kOn=ease(0.115), kOff=ease(0.026), kRot=ease(0.09), kOp=ease(0.075), kSz=ease(0.09);

    for(var i=0;i<P.length;i++){
      var p=P[i];
      var tgt=(assembled && i<len)?T[i]:null;
      var idle=assembled && !tgt;
      var gx,gy;

      if(tgt){ gx=tgt.x; gy=tgt.y; }
      else{
        gx=p.hx+Math.cos(t*p.f1+p.p1)*p.ax+Math.sin(t*p.f2*0.7+p.p2)*p.ax*0.35;
        gy=p.hy+Math.sin(t*p.f2+p.p2)*p.ay+Math.cos(t*p.f1*0.6+p.p1)*p.ay*0.35;
      }

      var k=tgt?kOn:kOff;
      p.x+=(gx-p.x)*k; p.y+=(gy-p.y)*k;

      if(tgt){ p.rot+=(0-p.rot)*kRot; } else { p.rot+=p.rs*f; }

      var wantOp = idle ? 0 : (tgt ? (tgt.edge?0.92:0.8) : p.o);
      p.cur += (wantOp-p.cur)*kOp;

      var wantSz = tgt ? (tgt.edge?unit*0.92:unit) : p.s;
      p.sz += (wantSz-p.sz)*kSz;

      if(p.cur<0.012) continue;

      ctx.fillStyle=(tgt&&tgt.a)
        ? 'rgba(228,87,58,'+Math.min(0.95,p.cur+0.12).toFixed(3)+')'
        : 'rgba(237,235,232,'+p.cur.toFixed(3)+')';

      if(Math.abs(p.rot)<0.02){
        ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);
      } else {
        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz);
        ctx.restore();
      }
    }
  }

  /* ---------- строка, которая называет собранную фигуру ---------- */

  var scrEl=document.getElementById('scrText');
  var scrLive=document.getElementById('scrLive');       /* стабильный текст для скринридера */
  var touch=window.matchMedia('(hover: none)').matches;
  var DEFAULT_PHRASE = touch ? 'Коснись частиц →' : 'Наведи на частицы →';

  var scrPool='абвгдежзиклмнопрстуфхцчшщэюя';
  var scrToken=0;
  var scrCurrent=DEFAULT_PHRASE;

  /* в разметке лежит десктопный вариант — на тач-устройстве подменяем сразу,
     без перебора букв: это стартовое состояние, а не реакция на действие */
  if(scrEl && scrEl.textContent.trim()!==DEFAULT_PHRASE){
    scrEl.textContent=DEFAULT_PHRASE;
    if(scrLive) scrLive.textContent=DEFAULT_PHRASE;
  }

  function scramble(text){
    if(!scrEl) return;
    var myToken=++scrToken;      /* всё, что запущено раньше, само остановится */
    var prev=scrCurrent;
    scrCurrent=text;

    /* при reduced-motion перебор букв не показываем — сразу конечный текст */
    if(reduce){
      scrEl.textContent=text;
      if(scrLive) scrLive.textContent=text;
      return;
    }

    var len=Math.max(prev.length,text.length);
    var frame=0, settle=[];
    for(var i=0;i<len;i++) settle.push(Math.round(i*1.6+Math.random()*14));

    (function tick(){
      if(myToken!==scrToken) return;     /* отменено более новым вызовом */
      var out='', done=true;
      for(var i=0;i<len;i++){
        var target=text[i];
        if(target===undefined){ if(frame<settle[i]) done=false; continue; }
        if(target===' '){ out+=' '; continue; }
        out+=(frame>=settle[i]) ? target : scrPool[Math.floor(Math.random()*scrPool.length)];
        if(frame<settle[i]) done=false;
      }
      scrEl.textContent=out;
      frame++;
      if(!done) requestAnimationFrame(tick);
      else if(scrLive) scrLive.textContent=text;   /* озвучиваем только осевшую фразу */
    })();
  }

  /* ---------- сборка фигуры ---------- */

  function pick(){
    if(LAYOUTS.length<2) return;
    var n=current;
    while(n===current) n=Math.floor(Math.random()*LAYOUTS.length);
    current=n;
  }

  /* один жест — один вызов, который меняет и фигуру, и строку */
  function on(){ pick(); assembled=true; scramble(DEFS[current].phrase); }
  function off(){ assembled=false; scramble(DEFAULT_PHRASE); }

  /* на тач-устройствах ховера нет: тап всегда показывает следующий макет,
     а через паузу без действий фигура сама возвращается в покой */
  var idle=0;
  function armIdle(){
    clearTimeout(idle);
    idle=setTimeout(off,4500);
  }

  cv.setAttribute('tabindex','0');
  if(!touch){
    cv.addEventListener('mouseenter',on);
    cv.addEventListener('mouseleave',off);
  }
  cv.addEventListener('click',function(){
    if(touch){ on(); armIdle(); return; }
    assembled ? off() : on();
  });
  cv.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      assembled ? off() : on();
    }
  });

  var rt;
  window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(size,150);});

  function init(){
    size();
    if(reduce){
      var L=LAYOUTS[0],T=L.targets;
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<T.length;i++){
        ctx.fillStyle=T[i].a?'rgba(228,87,58,.92)':'rgba(237,235,232,.84)';
        ctx.fillRect(T[i].x-L.unit/2,T[i].y-L.unit/2,L.unit,L.unit);
      }
      return;
    }
    var startTs=null, prevTs=null, running=false, rafId=0, visible=true;

    function loop(ts){
      if(startTs===null){ startTs=ts; prevTs=ts; }
      var dt=Math.min(0.1,(ts-prevTs)/1000);
      prevTs=ts;
      frame((ts-startTs)/1000, dt);
      rafId=requestAnimationFrame(loop);
    }
    function start(){
      if(running) return;
      running=true; prevTs=null;
      if(startTs!==null) startTs=null;
      rafId=requestAnimationFrame(loop);
    }
    function stop(){
      if(!running) return;
      running=false; cancelAnimationFrame(rafId);
    }
    function sync(){ (visible && !document.hidden) ? start() : stop(); }

    if('IntersectionObserver' in window){
      new IntersectionObserver(function(e){
        visible=e[0].isIntersecting; sync();
      },{threshold:0}).observe(cv);
    }
    document.addEventListener('visibilitychange',sync);
    sync();
  }
  init();
})();
