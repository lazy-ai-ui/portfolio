/* Карточка «следующий проект»: структура, которая постоянно себя строит.

   Это не индикатор загрузки. Система квадратных частиц — тот же материал,
   что и на первом экране, — раз за разом собирается в идеальный квадрат,
   какое-то время держится, начинает напрягаться, теряет целостность по
   линии излома, осыпается в аккуратную насыпь и собирается снова.

   Архитектура повторяет hero-canvas.js: пул частиц, лерп с независимым от
   частоты кадров коэффициентом, очередь прилёта с личной задержкой у каждой
   цели, пауза вне поля зрения. Отличие одно — фазы жизненного цикла и
   свободное падение вместо полёта к цели. */
(function(){
  var cv=document.getElementById('soonfig'); if(!cv) return;
  var ctx=cv.getContext('2d');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W=0,H=0,dpr=1,P=[],cols=0,rows=0,gap=8,unit=5,fault=0,baseY=0;

  /* Длительности фаз, секунды. Держатся вместе, чтобы ритм цикла читался
     из одного места. */
  var T_FORM=1.9, T_HOLD=0.55, T_TENSE=1.05, T_SAG=0.55, T_FALL_MAX=2.2, T_PILE=2.0;

  var ph='form', ph0=0, nowT=0;

  /* ---------- построение ---------- */

  function build(){
    var side=Math.min(W,H)*0.46;
    unit=Math.max(3,Math.round(side/19));
    gap=unit*1.6;
    cols=Math.max(5,Math.round(side/gap));
    rows=cols;

    var x0=(W-(cols-1)*gap)/2;
    /* квадрат стоит чуть выше центра: под ним должно оставаться место,
       куда осыпается насыпь, иначе падать некуда */
    var y0=H*0.44-(rows-1)*gap/2;
    baseY=H*0.88;

    /* Насыпь: ряды сужаются кверху. Форма задана заранее — так результат
       осыпания всегда аккуратен, а падение при этом остаётся честным
       свободным полётом, а не полётом по заготовленной траектории. */
    var need=cols*rows, pile=[], row=0;
    var wide=Math.max(6,Math.round(W*0.58/gap));
    while(pile.length<need){
      var c=Math.max(2,wide-row*2);
      var py=baseY-row*gap*0.84;
      var px0=(W-(c-1)*gap)/2;
      for(var i=0;i<c&&pile.length<need;i++){
        pile.push({
          x:px0+i*gap+(Math.random()-0.5)*gap*0.2,
          y:py+(Math.random()-0.5)*gap*0.1
        });
      }
      row++;
    }
    /* слоты раздаются по горизонтали в том же порядке, что и колонки:
       частица падает примерно под собой, ничто не пересекает кадр наискось */
    pile.sort(function(a,b){ return a.x-b.x; });

    var old=P, np=[], k=0;
    for(var r=0;r<rows;r++){
      for(var c2=0;c2<cols;c2++){
        var edge=(r===0||c2===0||r===rows-1||c2===cols-1);
        np.push({
          sx:x0+c2*gap, sy:y0+r*gap,
          col:c2, row:r, edge:edge,
          x:0,y:0,vy:0,rot:0,
          rs:(Math.random()-0.5)*0.9,
          /* личная задержка прилёта: слева направо и сверху вниз, как
             читается структура, плюс разброс — иначе видно ровный фронт */
          dl:(c2/cols*0.45+r/rows*0.35)*0.9+Math.random()*0.3,
          tk:0.05+Math.random()*0.035,
          f1:0.7+Math.random()*1.6, p1:Math.random()*Math.PI*2,
          f2:0.6+Math.random()*1.5, p2:Math.random()*Math.PI*2,
          o:(edge?0.30:0.19)+Math.random()*0.05,
          cur:0, a:false,
          fd:0, det:0, dets:0, falling:false, landed:false,
          px:0, py:0
        });
        k++;
      }
    }
    /* сортировка по x нужна только для раздачи слотов насыпи */
    var order=[];
    for(k=0;k<np.length;k++) order.push(k);
    order.sort(function(a,b){ return np[a].sx-np[b].sx; });
    for(k=0;k<order.length;k++){
      np[order[k]].px=pile[k].x;
      np[order[k]].py=pile[k].y;
    }

    /* один акцентный квадрат — та же связка с фирменным цветом, что и в hero */
    np[Math.floor(Math.random()*np.length)].a=true;

    /* при пересборке (resize) частицы не прыгают: позиции переносятся */
    for(k=0;k<np.length;k++){
      var o2=old[k];
      np[k].x=o2?o2.x:np[k].sx+(Math.random()-0.5)*W*0.5;
      np[k].y=o2?o2.y:np[k].sy+(Math.random()-0.5)*H*0.5;
      np[k].cur=o2?o2.cur:0;
      np[k].rot=o2?o2.rot:Math.random()*Math.PI;
    }
    P=np;
    pickFault();
  }

  /* линия излома: не край и не самый центр — оттуда разрушение читается хуже */
  function pickFault(){ fault=Math.max(1,Math.min(rows-2,Math.round(rows*(0.42+Math.random()*0.24)))); }

  function size(){
    var r=cv.getBoundingClientRect();
    W=Math.max(1,r.width); H=Math.max(1,r.height);
    dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.floor(W*dpr); cv.height=Math.floor(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    build();
  }

  /* ---------- фазы ---------- */

  function setPhase(n){
    ph=n; ph0=nowT;
    var i,p;
    if(n==='sag'){
      /* Разрывы появляются раньше проседания и именно у линии излома:
         структура сначала теряет связность, и только потом форму. */
      for(i=0;i<P.length;i++){
        p=P[i];
        if(Math.abs(p.row-fault)<=1&&Math.random()<0.22){ p.falling=true; p.vy=0; }
      }
    }
    if(n==='fall'){
      for(i=0;i<P.length;i++){
        p=P[i];
        /* обрушение расходится от излома: сначала ряды рядом с ним,
           дальние держатся ещё доли секунды */
        p.fd=Math.abs(p.row-fault)*0.055+Math.random()*0.09;
      }
    }
    if(n==='form'){
      for(i=0;i<P.length;i++){
        p=P[i];
        p.falling=false; p.landed=false; p.vy=0; p.det=0;
        p.dl=(p.col/cols*0.45+p.row/rows*0.35)*0.9+Math.random()*0.3;
      }
      pickFault();
    }
  }

  /* Отрыв одной-двух частиц в фазе напряжения: квадрат выглядит не дрожащим,
     а держащимся из последних сил. */
  function detach(){
    if(ph!=='tense') return;
    for(var n=0;n<12;n++){
      var p=P[Math.floor(Math.random()*P.length)];
      if(p.det>nowT) continue;
      p.det=nowT+0.55;
      p.dets=(Math.random()-0.5)*2;
      return;
    }
  }

  /* Перекат в насыпи: одна частица чуть смещается вбок. Насыпь остаётся
     насыпью, но перестаёт выглядеть отрисованной раз и навсегда. */
  function roll(){
    if(ph!=='pile') return;
    for(var n=0;n<14;n++){
      var p=P[Math.floor(Math.random()*P.length)];
      if(!p.landed||p.py>baseY-gap*0.5) continue;
      p.px+=(Math.random()<0.5?-1:1)*gap*0.5;
      p.py+=gap*0.12;
      return;
    }
  }

  /* ---------- кадр ---------- */

  function frame(t,dt){
    nowT=t;
    ctx.clearRect(0,0,W,H);
    var f=dt*60;
    function ease(k){ return k<=0?0:1-Math.pow(1-k,f); }
    var el=t-ph0;
    var kOp=ease(0.09), kRot=ease(0.07), kX=ease(0.035);
    var G=H*1.35;
    var i,p;

    /* переходы фаз */
    if(ph==='form'&&el>T_FORM) setPhase('hold');
    else if(ph==='hold'&&el>T_HOLD) setPhase('tense');
    else if(ph==='tense'&&el>T_TENSE) setPhase('sag');
    else if(ph==='sag'&&el>T_SAG) setPhase('fall');
    else if(ph==='fall'){
      var done=true;
      for(i=0;i<P.length;i++) if(!P[i].landed){ done=false; break; }
      if(done||el>T_FALL_MAX) setPhase('pile');
    }
    else if(ph==='pile'&&el>T_PILE) setPhase('form');
    el=t-ph0;

    /* амплитуда напряжения нарастает, а не включается */
    var tense=ph==='tense'?Math.min(1,el/T_TENSE):0;
    var sag=ph==='sag'?el/T_SAG:0;

    for(i=0;i<P.length;i++){
      p=P[i];
      var gx=p.sx, gy=p.sy, k;

      /* момент срыва проверяется до отрисовки: иначе частица пропадала
         на один кадр между «ещё стоит» и «уже падает» */
      if(ph==='fall'&&!p.falling&&el>p.fd){ p.falling=true; if(p.vy<0) p.vy=0; }

      if(p.falling){
        /* свободное падение с лёгким сопротивлением: без отскока и без
           ускорений сверх собственного веса */
        if(!p.landed){
          p.vy=(p.vy+G*dt)*Math.pow(0.985,f);
          p.y+=p.vy*dt;
          p.x+=(p.px-p.x)*kX;
          p.rot+=p.rs*dt;
          if(p.y>=p.py){ p.y=p.py; p.vy=0; p.landed=true; }
        } else {
          p.x+=(p.px-p.x)*kX;
          p.y+=(p.py-p.y)*kX;
          /* в насыпи квадраты выравниваются: куча, но опрятная */
          p.rot+=(0-p.rot)*ease(0.03);
        }
        p.cur+=(p.o-p.cur)*kOp;
        drawP(p);
        continue;
      }

      if(tense){
        /* дрожь — не общий shake, а собственный микроцикл каждой частицы:
           структура выглядит напряжённой изнутри, а не встряхиваемой снаружи */
        var amp=gap*0.16*tense*tense;
        gx+=Math.sin(t*p.f1*3.1+p.p1)*amp;
        gy+=Math.cos(t*p.f2*3.4+p.p2)*amp;
        if(p.det>t){
          var u=1-(p.det-t)/0.55;
          var bell=Math.sin(u*Math.PI);
          gx+=p.dets*gap*1.5*bell;
          gy-=bell*gap*0.7;
        }
      }

      if(sag){
        /* верхняя часть оседает в разрыв, нижняя пока держит */
        if(p.row<fault){
          var d=(fault-p.row)/fault;
          gy+=gap*1.15*sag*sag*d;
          gx+=(p.col-(cols-1)/2)*gap*0.05*sag*sag*d;
        }
      }

      if(ph==='form'){
        /* ворота лерпа: коэффициент не включается скачком, а нарастает по
           своей кривой после личной задержки — разгон и торможение без
           отдельной физики, тот же приём, что и на первом экране */
        var e=t-ph0-p.dl;
        var g=e<=0?0:Math.min(1,e/0.85);
        k=ease(p.tk*g*g*(3-2*g));
      } else {
        k=ease(0.14);
      }
      /* прозрачность не привязана к фазе: частицы из насыпи именно взлетают,
         а не гаснут и появляются на новом месте */
      p.cur+=(p.o-p.cur)*kOp;

      p.x+=(gx-p.x)*k; p.y+=(gy-p.y)*k;
      p.rot+=(0-p.rot)*kRot;
      drawP(p);
    }
  }

  function drawP(p){
    var a=p.cur;
    if(a<0.012) return;
    var sz=p.edge?unit*0.92:unit;
    ctx.fillStyle=p.a
      ? 'rgba(228,87,58,'+Math.min(0.8,a+0.28).toFixed(3)+')'
      : 'rgba(11,11,12,'+a.toFixed(3)+')';
    if(Math.abs(p.rot)<0.02){
      ctx.fillRect(p.x-sz/2,p.y-sz/2,sz,sz);
    } else {
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-sz/2,-sz/2,sz,sz);
      ctx.restore();
    }
  }

  /* ---------- запуск ---------- */

  var rt;
  window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(size,180);});

  size();

  if(reduce){
    /* без движения показываем собранный квадрат — состояние, к которому
       структура стремится */
    for(var i=0;i<P.length;i++){
      var p=P[i]; p.x=p.sx; p.y=p.sy; p.rot=0; p.cur=p.o;
      drawP(p);
    }
    return;
  }

  var startTs=null,prevTs=null,running=false,rafId=0,visible=true,lastT=0;
  var detT=0,rollT=0;

  function loop(ts){
    /* Время продолжается с того места, где остановилось. Если начинать отсчёт
       заново, ph0 остаётся от прошлого запуска, el становится отрицательным,
       и переходы фаз перестают срабатывать — цикл замирает навсегда. Именно
       так структура зависала в виде насыпи после скролла. */
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
    detT=setInterval(detach,380);
    rollT=setInterval(roll,760);
    rafId=requestAnimationFrame(loop);
  }
  function stop(){
    if(!running) return;
    running=false;
    cancelAnimationFrame(rafId);
    clearInterval(detT); clearInterval(rollT);
  }
  function sync(){ (visible&&!document.hidden)?start():stop(); }

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(e){
      visible=e[0].isIntersecting; sync();
    },{threshold:0}).observe(cv);
  }
  document.addEventListener('visibilitychange',sync);
  sync();
})();
