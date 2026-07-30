/* Аннотации на макете.
   Словарь тот же, что в хиро: квадрат, шаг сетки, коралловый акцент.
   Выноска собирается из частиц вокруг пульсирующей точки и разбирается обратно. */
(function(){
  var stage=document.getElementById('annoStage');
  if(!stage) return;

  var hint=document.getElementById('annoHint');
  var prev=document.getElementById('annoPrev');
  var next=document.getElementById('annoNext');
  var full=document.getElementById('annoFull');
  var mob=document.getElementById('annoMobile');
  var anno=document.getElementById('anno');

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DATA=[
    { x:27, y:20,
      insight:'Пользователь приходит в систему за оценкой состояния, а не за изучением структуры.',
      solution:'Infrastructure Health: четыре ключевых показателя с пометкой, что именно не так — сразу на входе.' },
    { x:43, y:5,
      insight:'Человек заранее знает, что ищет, но вынужден идти в обход через навигацию и разделы.',
      solution:'Глобальный поиск по IP, имени, VLAN и тегу — с любого известного параметра, а не только по точному названию.' },
    { x:50, y:50,
      insight:'При инциденте информацию приходится собирать вручную из нескольких источников.',
      solution:'Alerts, Audit Log и Capacity на одном уровне: что случилось, кто менял конфиг и насколько загружены стойки.' },
    { x:52, y:85,
      insight:'Пользователи возвращаются к одним и тем же объектам и повторяют одни и те же действия.',
      solution:'Continue working и Quick actions: последние объекты и частые операции в один клик, без навигации.' }
  ];

  var cur=-1;          /* -1 — ничего не открыто */
  var spots=[], tips=[];

  function bodyHTML(d){
    return '<div class="tip__body">'+
             '<p class="tip__k">Инсайт из интервью</p>'+
             '<p class="tip__t">'+d.insight+'</p>'+
             '<p class="tip__k2">Как решено</p>'+
             '<p class="tip__t2">'+d.solution+'</p>'+
           '</div>';
  }

  /* ---------- сборка выноски из квадратиков ---------- */

  function Fx(tip){
    this.tip=tip;
    this.cv=document.createElement('canvas');
    this.cv.className='tip__fx';
    this.cv.setAttribute('aria-hidden','true');
    tip.appendChild(this.cv);
    this.ctx=this.cv.getContext('2d');
    this.raf=0;
  }

  /* сетка частиц по площади выноски + точка вылета со стороны хотспота */
  Fx.prototype.build=function(fromX,fromY){
    var r=this.tip.getBoundingClientRect();
    var W=Math.max(1,r.width), H=Math.max(1,r.height);
    var dpr=Math.min(window.devicePixelRatio||1,2);

    this.cv.width=Math.floor(W*dpr); this.cv.height=Math.floor(H*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.W=W; this.H=H;

    var step=Math.max(13,Math.round(W/24));
    var cx=Math.max(1,Math.floor(W/step)), cy=Math.max(1,Math.floor(H/step));
    var sx=W/cx, sy=H/cy;

    var P=[];
    for(var i=0;i<cx;i++)for(var j=0;j<cy;j++){
      var a=Math.random()*Math.PI*2;
      var rad=Math.pow(Math.random(),0.55);
      P.push({
        tx:sx*(i+0.5), ty:sy*(j+0.5),
        /* стартуют россыпью вокруг точки, из которой «вылетает» выноска */
        fx:fromX+Math.cos(a)*rad*W*0.42,
        fy:fromY+Math.sin(a)*rad*H*0.5,
        rot:(Math.random()-0.5)*Math.PI,
        sz:Math.max(3,step*(0.42+Math.random()*0.34)),
        accent:Math.random()<0.09,
        d:Math.random()*0.32          /* разнобой во времени вылета */
      });
    }
    this.P=P;
    return this;
  };

  Fx.prototype.stop=function(){
    if(this.raf){ cancelAnimationFrame(this.raf); this.raf=0; }
    if(this.guard){ clearTimeout(this.guard); this.guard=0; }
  };

  Fx.prototype.clear=function(){
    if(this.W) this.ctx.clearRect(0,0,this.W,this.H);
  };

  /* dir: 1 — собирается, -1 — разбирается */
  Fx.prototype.run=function(dir,dur,done){
    var self=this, P=this.P, ctx=this.ctx;
    var t0=null, finished=false;
    this.stop();

    function finish(){
      if(finished) return;
      finished=true;
      self.stop();
      ctx.clearRect(0,0,self.W,self.H);
      if(done) done();
    }
    /* rAF не идёт в фоновой вкладке — подстраховываем, чтобы состояние
       не залипло на полпути (иначе выноску нельзя будет закрыть) */
    this.guard=setTimeout(finish,dur+400);

    function ease(k){ return 1-Math.pow(1-k,3); }   /* easeOutCubic */

    function frame(ts){
      if(t0===null) t0=ts;
      var p=Math.min(1,(ts-t0)/dur);
      ctx.clearRect(0,0,self.W,self.H);

      for(var i=0;i<P.length;i++){
        var q=P[i];
        /* каждая частица стартует со своей задержкой */
        var lp=Math.min(1,Math.max(0,(p-q.d)/(1-q.d)));
        var k=ease(lp);
        var g=(dir>0)?k:1-k;      /* при разборе идём обратно */

        var x=q.fx+(q.tx-q.fx)*g;
        var y=q.fy+(q.ty-q.fy)*g;
        var rot=q.rot*(1-g);
        var alpha=(dir>0? g : g)*0.85;
        if(alpha<0.02) continue;

        ctx.save();
        ctx.translate(x,y);
        if(Math.abs(rot)>0.02) ctx.rotate(rot);
        ctx.fillStyle=q.accent
          ? 'rgba(228,87,58,'+Math.min(0.95,alpha+0.12).toFixed(3)+')'
          : 'rgba(11,11,12,'+(alpha*0.55).toFixed(3)+')';
        ctx.fillRect(-q.sz/2,-q.sz/2,q.sz,q.sz);
        ctx.restore();
      }

      if(p<1){ self.raf=requestAnimationFrame(frame); }
      else{ self.raf=0; finish(); }
    }
    this.raf=requestAnimationFrame(frame);
  };

  /* ---------- построение точек и выносок ---------- */

  DATA.forEach(function(d,i){
    var b=document.createElement('button');
    b.type='button'; b.className='hs'; b.textContent=(i+1);
    b.style.left=d.x+'%'; b.style.top=d.y+'%';
    b.setAttribute('aria-label','Аннотация '+(i+1)+' из '+DATA.length);
    b.setAttribute('aria-expanded','false');
    b.addEventListener('click',function(e){
      e.stopPropagation();
      (cur===i) ? close() : go(i);
    });
    stage.appendChild(b); spots.push(b);

    var t=document.createElement('div');
    t.className='tip'; t.innerHTML=bodyHTML(d);
    /* сторона выноски — чтобы не уезжала за край */
    var right = d.x>52;
    var bottom = d.y>58;
    t.style.left = right ? 'auto' : 'calc('+d.x+'% + 26px)';
    t.style.right = right ? 'calc('+(100-d.x)+'% + 26px)' : 'auto';
    t.style.top = bottom ? 'auto' : 'calc('+d.y+'% - 10px)';
    t.style.bottom = bottom ? 'calc('+(100-d.y)+'% - 10px)' : 'auto';
    t.dataset.side = (right?'r':'l')+(bottom?'b':'t');
    t.addEventListener('click',function(e){ e.stopPropagation(); });
    stage.appendChild(t); tips.push(t);
    t._fx=new Fx(t);
  });

  /* мобильная выноска — под картинкой, тот же эффект */
  var mobTip=document.createElement('div');
  mobTip.className='tip';
  mobTip.addEventListener('click',function(e){ e.stopPropagation(); });
  mob.appendChild(mobTip);
  mobTip._fx=new Fx(mobTip);

  function isMobile(){ return window.matchMedia('(max-width:760px)').matches; }

  /* какая выноска сейчас на экране: боковая или нижняя */
  function activeTip(i){ return isMobile() ? mobTip : tips[i]; }

  /* отложенное появление карточки нужно снимать при закрытии,
     иначе таймер дорисует фон уже закрытой выноске */
  function clearShow(tip){
    if(tip._showT){ clearTimeout(tip._showT); tip._showT=0; }
  }

  function openTip(tip,side){
    clearShow(tip);
    tip.classList.add('on');
    if(reduce){ tip.classList.add('shown'); return; }

    /* точка вылета: угол выноски, обращённый к хотспоту */
    var r=tip.getBoundingClientRect();
    var fromX = side.indexOf('r')>-1 ? r.width : 0;
    var fromY = side.indexOf('b')>-1 ? r.height : 0;
    if(isMobile()){ fromX=r.width/2; fromY=0; }

    tip._fx.build(fromX,fromY).run(1,560,null);
    tip._showT=setTimeout(function(){ tip._showT=0; tip.classList.add('shown'); },230);
  }

  function closeTip(tip,side,after){
    clearShow(tip);
    if(reduce){
      tip.classList.remove('shown','on');
      if(after) after();
      return;
    }
    var r=tip.getBoundingClientRect();
    var fromX = side.indexOf('r')>-1 ? r.width : 0;
    var fromY = side.indexOf('b')>-1 ? r.height : 0;
    if(isMobile()){ fromX=r.width/2; fromY=0; }

    tip.classList.remove('shown');
    tip._fx.build(fromX,fromY).run(-1,360,function(){
      tip.classList.remove('on');
      if(after) after();
    });
  }

  function setHint(){
    hint.textContent = (cur<0)
      ? DATA.length+' аннотации'
      : (cur+1)+' / '+DATA.length;
  }

  function close(){
    if(cur<0) return;
    var i=cur, tip=activeTip(i);
    var side=tips[i].dataset.side;
    cur=-1;
    spots[i].classList.remove('on');
    spots[i].setAttribute('aria-expanded','false');
    closeTip(tip,side);
    /* вторую (скрытую по медиа-запросу) выноску просто гасим */
    var other = (tip===mobTip)?tips[i]:mobTip;
    clearShow(other);
    other.classList.remove('on','shown');
    other._fx.stop(); other._fx.clear();
    setHint();
  }

  function go(i){
    i=(i+DATA.length)%DATA.length;

    /* если что-то открыто — сначала убираем это, без ожидания */
    if(cur>-1 && cur!==i){
      var p=cur, ptip=activeTip(p);
      spots[p].classList.remove('on');
      spots[p].setAttribute('aria-expanded','false');
      clearShow(ptip);
      ptip._fx.stop();
      ptip.classList.remove('on','shown');
      ptip._fx.clear();
      var pother=(ptip===mobTip)?tips[p]:mobTip;
      clearShow(pother);
      pother.classList.remove('on','shown');
    }

    cur=i;
    spots[i].classList.add('on');
    spots[i].setAttribute('aria-expanded','true');

    if(isMobile()) mobTip.innerHTML=bodyHTML(DATA[i]);
    if(!isMobile()){ mobTip.classList.remove('on','shown'); }
    else { tips.forEach(function(t){ t.classList.remove('on','shown'); }); }

    var tip=activeTip(i);
    if(tip===mobTip){ mobTip._fx=mobTip._fx||new Fx(mobTip); mobTip.appendChild(mobTip._fx.cv); }
    openTip(tip,tips[i].dataset.side);
    setHint();
  }

  prev.addEventListener('click',function(e){ e.stopPropagation(); go(cur<0?DATA.length-1:cur-1); });
  next.addEventListener('click',function(e){ e.stopPropagation(); go(cur<0?0:cur+1); });

  /* клик по любой свободной области — свернуть */
  document.addEventListener('click',function(){ close(); });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape' && cur>-1 && !document.fullscreenElement) close();
  });

  /* ---------- полноэкранный просмотр ---------- */
  if(full){
    var canFs = anno && (anno.requestFullscreen||anno.webkitRequestFullscreen);
    if(!canFs){ full.hidden=true; }
    else{
      full.addEventListener('click',function(e){
        e.stopPropagation();
        if(document.fullscreenElement||document.webkitFullscreenElement){
          (document.exitFullscreen||document.webkitExitFullscreen).call(document);
        } else {
          (anno.requestFullscreen||anno.webkitRequestFullscreen).call(anno);
        }
      });
      document.addEventListener('fullscreenchange',function(){
        var on=!!document.fullscreenElement;
        full.textContent = on ? 'Свернуть ⤡' : 'Развернуть ⤢';
        /* размеры выноски меняются вместе со сценой */
        if(cur>-1){ var t=activeTip(cur); t._fx.stop(); t._fx.clear(); }
      });
    }
  }

  setHint();
})();

/* оговорка «что ещё стоит проверить» */
(function(){
  var wrap=document.getElementById('caveat');
  if(!wrap) return;
  var btn=document.getElementById('caveatBtn');
  function toggle(open){
    wrap.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',open?'true':'false');
  }
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    toggle(!wrap.classList.contains('open'));
  });
  wrap.addEventListener('mouseenter',function(){ toggle(true); });
})();
