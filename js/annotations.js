/* Аннотации на макете.
   Словарь тот же, что в хиро: квадрат, шаг сетки, коралловый акцент.

   Принцип бесшовности взят оттуда же: частицы не «дорисовываются» к готовой
   карточке, а САМИ становятся ею. К концу сборки они вырастают до размера
   ячейки, смыкаются без зазоров и белеют до цвета --surface — в этот момент
   под ними включается настоящий фон выноски, и подмена не видна. */
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ASSEMBLE=540, DISASSEMBLE=365, HANDOFF=190;

  /* Аннотированных экранов на странице несколько, поэтому тексты лежат
     здесь по id блока, а сама механика запускается для каждого своя.
     Выноска бывает двух видов: пара «инсайт и решение» на главном экране
     и одна строка там, где экран говорит сам за себя. */
  var SETS={};

  SETS.anno=[
    { x:27, y:20,
      insight:'Инженер заходит узнать, всё ли в порядке, а не изучать структуру дата-центра.',
      solution:'Infrastructure Health прямо на входе: четыре показателя и пометка, что именно не так.' },
    { x:43, y:5,
      insight:'Инженер заранее знает, что ищет, но добирается до этого через разделы и навигацию.',
      solution:'Поиск по IP, имени, VLAN и тегу: искать можно по любому известному параметру, а не только по точному названию.' },
    { x:50, y:50,
      insight:'При инциденте картину приходится собирать руками из разных мест.',
      solution:'Alerts, Audit Log и Capacity рядом: что случилось, кто менял конфиг, насколько загружены стойки.' },
    { x:52, y:85,
      insight:'Инженер возвращается к тем же объектам и повторяет те же действия.',
      solution:'Continue working и Quick actions: последние объекты и частые операции в один клик, без навигации.' }
  ];

  SETS.annoSearch=[
    { x:49, y:3,
      line:'Достаточно ввести кусок информации, и система сама сориентирует, с чем работал недавно.' },
    { x:27, y:30,
      line:'Результаты разложены по типам, а не свалены в один список: видно, где адрес, где устройство, где стойка.' },
    { x:27, y:47,
      line:'Сразу понятно, сколько всего нашлось и куда идти дальше, если нужен весь список.' }
  ];

  document.querySelectorAll('.anno').forEach(function(root){
    var set=SETS[root.id];
    if(set) init(root,set);
  });

function init(anno,DATA){
  var stage=anno.querySelector('.anno__stage');
  if(!stage) return;

  var hint=anno.querySelector('.anno__hint');
  var prev=anno.querySelector('[data-anno-prev]');
  var next=anno.querySelector('[data-anno-next]');
  var full=anno.querySelector('[data-anno-full]');
  var mob=anno.querySelector('.anno__mobile');

  var cur=-1;          /* -1 — ничего не открыто */
  var spots=[], tips=[];

  function bodyHTML(d){
    if(d.line){
      return '<div class="tip__body"><p class="tip__t tip__t--one">'+d.line+'</p></div>';
    }
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
    tip.insertBefore(this.cv,tip.firstChild);
    this.ctx=this.cv.getContext('2d');
    this.raf=0; this.guard=0; this.W=0; this.H=0; this.P=[];
  }

  /* сетка частиц по площади выноски; облако вылета смещено к хотспоту */
  Fx.prototype.build=function(anchorX,anchorY){
    var r=this.tip.getBoundingClientRect();
    var W=Math.max(1,r.width), H=Math.max(1,r.height);
    var dpr=Math.min(window.devicePixelRatio||1,2);

    this.cv.width=Math.floor(W*dpr); this.cv.height=Math.floor(H*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.W=W; this.H=H;

    var step=Math.max(14,Math.round(W/20));
    var cx=Math.max(1,Math.round(W/step)), cy=Math.max(1,Math.round(H/step));
    var sx=W/cx, sy=H/cy;
    /* +1px перекрытия, чтобы в собранном виде не было швов между плитками */
    var full=Math.ceil(Math.max(sx,sy))+1;

    /* центр облака сдвинут к точке, из которой «вылетает» выноска */
    var ox=W/2+(anchorX-W/2)*0.55;
    var oy=H/2+(anchorY-H/2)*0.55;

    var P=[];
    for(var i=0;i<cx;i++)for(var j=0;j<cy;j++){
      var a=Math.random()*Math.PI*2;
      var rad=Math.pow(Math.random(),0.62);
      P.push({
        tx:sx*(i+0.5), ty:sy*(j+0.5),
        fx:ox+Math.cos(a)*rad*W*0.62,
        fy:oy+Math.sin(a)*rad*H*0.72,
        rot:(Math.random()-0.5)*1.1,
        sz0:full*(0.3+Math.random()*0.22), sz1:full,
        accent:Math.random()<0.08,
        d:Math.random()*0.22          /* лёгкий разнобой во времени вылета */
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

  /* g: 0 — россыпь, 1 — собранная плитка цвета карточки */
  Fx.prototype.draw=function(gOf){
    var ctx=this.ctx, P=this.P;
    ctx.clearRect(0,0,this.W,this.H);

    for(var i=0;i<P.length;i++){
      var q=P[i];
      var g=gOf(q);
      if(g<=0.001) continue;

      var x=q.fx+(q.tx-q.fx)*g;
      var y=q.fy+(q.ty-q.fy)*g;
      var sz=q.sz0+(q.sz1-q.sz0)*g;
      var rot=q.rot*(1-g);
      var alpha=0.5+0.5*g;

      /* цвет ведём от тёплой серой россыпи к белому фону карточки,
         коралловые квадраты белеют только на финише */
      var cr,cg,cb;
      if(q.accent){
        var m=Math.max(0,(g-0.5)*2);
        cr=228+(255-228)*m; cg=87+(255-87)*m; cb=58+(255-58)*m;
      } else {
        cr=214+41*g; cg=211+44*g; cb=207+48*g;
      }

      ctx.fillStyle='rgba('+(cr|0)+','+(cg|0)+','+(cb|0)+','+alpha.toFixed(3)+')';

      if(Math.abs(rot)<0.02){
        ctx.fillRect(x-sz/2,y-sz/2,sz,sz);
      } else {
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(rot);
        ctx.fillRect(-sz/2,-sz/2,sz,sz);
        ctx.restore();
      }
    }
  };

  /* полностью собранное состояние — сплошная плитка цвета карточки */
  Fx.prototype.drawSolid=function(){
    this.draw(function(){ return 1; });
  };

  /* dir: 1 — собирается, -1 — разбирается */
  Fx.prototype.run=function(dir,dur,done){
    var self=this;
    var t0=null, finished=false;
    this.stop();

    function finish(){
      if(finished) return;
      finished=true;
      self.stop();
      if(done) done();
    }
    /* rAF не идёт в фоновой вкладке — подстраховываем, чтобы состояние
       не залипло на полпути (иначе выноску нельзя будет закрыть) */
    this.guard=setTimeout(finish,dur+400);

    function ease(k){ return 1-Math.pow(1-k,3); }   /* easeOutCubic */

    function frame(ts){
      if(t0===null) t0=ts;
      var p=Math.min(1,(ts-t0)/dur);

      self.draw(function(q){
        var lp=Math.min(1,Math.max(0,(p-q.d)/(1-q.d)));
        var k=ease(lp);
        return dir>0 ? k : 1-k;
      });

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
    /* для мобильного выезда порог свой: десктопный (x>52) выбирает сторону
       всплытия выноски, а тут важно, в какой половине макета стоит точка */
    t.dataset.mob = d.x>=50 ? 'r' : 'l';
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
  function activeTip(i){ return isMobile() ? mobTip : tips[i]; }

  /* точка, из которой вылетают частицы: угол выноски со стороны хотспота */
  function anchorOf(tip,side){
    var r=tip.getBoundingClientRect();
    if(isMobile()) return [r.width/2,0];
    return [side.indexOf('r')>-1?r.width:0, side.indexOf('b')>-1?r.height:0];
  }

  function clearTimers(tip){
    if(tip._showT){ clearTimeout(tip._showT); tip._showT=0; }
    if(tip._clearT){ clearTimeout(tip._clearT); tip._clearT=0; }
  }

  function reset(tip){
    clearTimers(tip);
    tip._fx.stop(); tip._fx.clear();
    tip.classList.remove('on','solid','shown','from-right');
  }

  function openTip(tip,side){
    clearTimers(tip);
    tip.classList.add('on');
    if(reduce){ tip.classList.add('solid','shown'); return; }

    /* На узком экране частиц нет — выноска выезжает со стороны своей точки.
       Стили прогоняем принудительно: элемент был display:none, и без этого
       переход стартовал бы уже в конечном состоянии. */
    if(isMobile()){
      tip.classList.toggle('from-right', tip.dataset.mob==='r');
      void tip.offsetHeight;
      tip.classList.add('solid','shown');
      return;
    }

    var a=anchorOf(tip,side);
    tip._fx.build(a[0],a[1]).run(1,ASSEMBLE,function(){
      /* частицы уже сомкнулись в белую плитку — включаем фон и текст
         под ней, цвет тот же, поэтому стыка не видно */
      tip.classList.add('solid','shown');
      tip._clearT=setTimeout(function(){
        tip._clearT=0; tip._fx.clear();
      },HANDOFF);
    });
  }

  function closeTip(tip,side,after){
    clearTimers(tip);
    if(reduce){
      tip.classList.remove('solid','shown','on','from-right');
      if(after) after();
      return;
    }

    if(isMobile()){
      tip.classList.remove('shown');          /* уезжает обратно и гаснет */
      tip._showT=setTimeout(function(){
        tip._showT=0;
        tip.classList.remove('on','solid','from-right');
        if(after) after();
      },280);
      return;
    }

    /* сначала уводим текст, карточка пока стоит */
    tip.classList.remove('shown');
    tip._showT=setTimeout(function(){   /* столько же, сколько длится уход текста */
      tip._showT=0;
      var a=anchorOf(tip,side);
      /* рисуем плитку и в тот же кадр гасим фон — карточка «становится»
         частицами, а не исчезает под ними */
      tip._fx.build(a[0],a[1]).drawSolid();
      tip.classList.remove('solid');
      tip._fx.run(-1,DISASSEMBLE,function(){
        tip._fx.clear();
        tip.classList.remove('on');
        if(after) after();
      });
    },170);
  }

  function setHint(){
    hint.textContent = (cur<0) ? DATA.length+' аннотации' : (cur+1)+' / '+DATA.length;
  }

  /* Клик по точке должен давать видимый результат: если выноска оказалась
     за пределами экрана (на мобилке она под картинкой), подводим к ней.
     Уже видимую не дёргаем — прокрутка без причины раздражает. */
  function reveal(tip){
    var how = reduce ? 'auto' : 'smooth';
    var r = tip.getBoundingClientRect();
    if(!r.height) return;

    if(modalOpen && shade){
      var sr=shade.getBoundingClientRect();
      if(r.bottom<=sr.bottom-12 && r.top>=sr.top+12) return;
      shade.scrollTo({top:shade.scrollTop+(r.top-sr.top)-16, behavior:how});
      return;
    }

    var TOP=88;      /* плавающий навбар сверху */
    var BOTTOM=96;   /* навигация по разделам снизу */
    var free=window.innerHeight-TOP-BOTTOM;
    if(r.top>=TOP && r.bottom<=window.innerHeight-BOTTOM) return;

    /* Двигаем на минимум: ровно настолько, чтобы выноска влезла снизу.
       Так макет и кнопки перелистывания остаются на экране — иначе после
       клика теряется то, ради чего аннотацию и открывали. */
    var delta;
    if(r.height<=free){
      delta = (r.bottom>window.innerHeight-BOTTOM)
        ? r.bottom-(window.innerHeight-BOTTOM)+12
        : r.top-TOP-12;
    } else {
      delta = r.top-TOP-12;      /* целиком не помещается — ставим верх под навбар */
    }
    window.scrollTo({top:Math.max(0,window.pageYOffset+delta), behavior:how});
  }

  function close(){
    if(cur<0) return;
    var i=cur, tip=activeTip(i), side=tips[i].dataset.side;
    cur=-1;
    spots[i].classList.remove('on');
    spots[i].setAttribute('aria-expanded','false');
    closeTip(tip,side);
    reset((tip===mobTip)?tips[i]:mobTip);   /* вторую, скрытую по медиа-запросу, гасим */
    setHint();
  }

  function go(i){
    i=(i+DATA.length)%DATA.length;

    /* точка ещё под старым экраном — просим шторку доехать до неё,
       и на время проезда запрещаем автозакрытие */
    if(spots[i].classList.contains('is-covered')){
      revealGuard=Date.now()+700;
      document.dispatchEvent(new CustomEvent('cmp:reveal',{detail:{x:DATA[i].x}}));
    }

    if(cur>-1 && cur!==i){
      var p=cur;
      spots[p].classList.remove('on');
      spots[p].setAttribute('aria-expanded','false');
      reset(activeTip(p));
      reset((activeTip(p)===mobTip)?tips[p]:mobTip);
    }

    cur=i;
    spots[i].classList.add('on');
    spots[i].setAttribute('aria-expanded','true');

    if(isMobile()){
      mobTip.innerHTML=bodyHTML(DATA[i]);
      mobTip.insertBefore(mobTip._fx.cv,mobTip.firstChild);
      mobTip.dataset.mob=tips[i].dataset.mob;
      tips.forEach(reset);
    } else {
      reset(mobTip);
    }

    var tip=activeTip(i);
    openTip(tip,tips[i].dataset.side);
    reveal(tip);
    setHint();
    panTo(i);
  }

  /* В полноэкранном режиме на телефоне сцена шире экрана и ездит вбок:
     дашборд в 350px нечитаем, поэтому там он развёрнут до 1100px. Значит
     следующая точка запросто оказывается за кадром, и без подводки кнопка
     «Вперёд» выглядит сломанной — аннотация открылась, а где она, непонятно.

     Считать смещение руками не выходит: следом за открытием выноски идёт
     reveal(), который тоже двигает контейнер, и ручная арифметика по
     scrollLeft разъезжалась с ним. scrollIntoView отдаёт расчёт браузеру,
     а block:'nearest' держит вертикаль на месте — едем только вбок. */
  function panTo(i){
    var box=anno.closest('.shade');
    if(!box || box.scrollWidth<=box.clientWidth) return;
    if(!spots[i].scrollIntoView) return;
    spots[i].scrollIntoView({
      behavior:reduce?'auto':'smooth', block:'nearest', inline:'center'
    });
  }

  /* ---------- связь со шторкой «было / стало» ---------- */
  /* Аннотация принадлежит новому экрану, поэтому появляется ровно тогда,
     когда шторка до неё дошла, и гаснет, если её снова закрыли старым. */
  var cmpBox=anno.querySelector('.cmp');
  var revealGuard=0;

  function applyCover(p){
    DATA.forEach(function(d,i){
      var covered = d.x-1.2 < p;      /* точка левее шторки: её закрыл старый экран */
      spots[i].classList.toggle('is-covered',covered);
      spots[i].disabled=covered;
      if(covered && cur===i && Date.now()>revealGuard) close();
    });
  }

  /* экран без шторки: точки видны всегда */
  if(cmpBox){
    document.addEventListener('cmp:pos',function(e){ applyCover(e.detail.pos); });
    var startPos=parseFloat(cmpBox.dataset.pos);
    applyCover(isNaN(startPos) ? 0 : startPos);
  }

  prev.addEventListener('click',function(e){ e.stopPropagation(); go(cur<0?DATA.length-1:cur-1); });
  next.addEventListener('click',function(e){ e.stopPropagation(); go(cur<0?0:cur+1); });

  /* клик по любой свободной области — свернуть */
  document.addEventListener('click',function(){ close(); });

  /* ---------- увеличенный просмотр макета ---------- */
  /* Своя модалка, а не Fullscreen API: нативный режим разворачивает всё окно
     браузера и вешает системную плашку про Esc — не то, что нужно. */
  var shade=null, slot=null, modalOpen=false;

  /* сбрасываем открытый инсайт без анимации: при смене размера сцены
     холст выноски всё равно пришлось бы пересобирать */
  function dropOpen(){
    if(cur>-1){
      spots[cur].classList.remove('on');
      spots[cur].setAttribute('aria-expanded','false');
      cur=-1;
    }
    tips.forEach(reset); reset(mobTip);
    setHint();
  }

  function makeShade(){
    shade=document.createElement('div');
    shade.className='shade';
    document.body.appendChild(shade);
    shade.addEventListener('click',function(e){
      /* клик по самой картинке или по панели кнопок модалку не закрывает */
      if(e.target.closest('.anno__stage')||e.target.closest('.anno__bar')) return;
      /* если открыт инсайт — этот клик тратится на него (закроет обработчик
         на document), картинка закроется следующим */
      if(cur>-1) return;
      closeModal();
    });
  }

  function openModal(){
    if(modalOpen) return;
    if(!shade) makeShade();
    dropOpen();
    slot=document.createComment('anno');
    anno.parentNode.insertBefore(slot,anno);
    shade.appendChild(anno);
    document.body.classList.add('shade-open');
    /* синхронно прогоняем стили, чтобы переход отработал: на rAF полагаться
       нельзя — в фоновой вкладке он не идёт, и подложка осталась бы скрытой */
    void shade.offsetHeight;
    shade.classList.add('on');
    modalOpen=true;
    full.textContent='Свернуть ⤡';

    /* Увеличенный просмотр — это разговор про новый экран: аннотации живут
       на нём. Если шторка ещё стоит на старом (а на входе она стоит именно
       там, и уезжает только после автопроезда), то все точки помечены
       is-covered и выключены — тап по ним не делает ровно ничего, и режим
       выглядит сломанным. Поэтому на открытии уводим шторку сами.
       Проверка на cmpBox обязательна: экран поиска шторки не имеет, и без
       неё его «Развернуть» дёргало бы шторку соседнего блока. */
    if(cmpBox) document.dispatchEvent(new CustomEvent('cmp:reveal',{detail:{x:30}}));
  }

  function closeModal(){
    if(!modalOpen) return;
    dropOpen();
    shade.classList.remove('on');
    slot.parentNode.insertBefore(anno,slot);
    slot.parentNode.removeChild(slot);
    slot=null;
    document.body.classList.remove('shade-open');
    modalOpen=false;
    full.textContent='Развернуть ⤢';
  }

  if(full){
    full.addEventListener('click',function(e){
      e.stopPropagation();
      modalOpen ? closeModal() : openModal();
    });
  }

  /* Escape: сначала инсайт, потом картинка */
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape') return;
    if(cur>-1){ close(); return; }
    if(modalOpen) closeModal();
  });

  setHint();
}
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
