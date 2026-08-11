/* Облако частиц первого экрана.

   Ключевая идея: частицы — не эффект, а материал. У системы есть набор
   «форм» (form) — осмысленных состояний, в которые она умеет собираться.
   Надпись PRODUCT DESIGNER и макеты интерфейсов равноправны: это просто
   разные формы одного организма. Форма покоя задаётся переменной restForm,
   и чтобы завтра поставить в покой другую структуру, достаточно построить
   ещё одну форму — остальная логика не меняется.

   Жизненный цикл:
     хаос (только при первом открытии) → форма покоя → интерфейс → форма покоя
*/
(function(){
  var cv=document.getElementById('fig'); if(!cv) return;
  var ctx=cv.getContext('2d');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W=0,H=0,dpr=1,P=[];

  /* ---------- описания форм-интерфейсов ---------- */

  var DEFS=[
    {
      name:'dashboard', ratio:0.62, unitDiv:68, accent:[3],
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
      /* смартфон: пропорции корпуса 19.5:9, как у Pro-моделей. Узнаваемость
         держится не на карточках, а на трёх признаках устройства — островок,
         таб-бар и home indicator. Без них любой вертикальный набор блоков
         читается просто как узкая колонка. */
      name:'phone', ratio:2.16, unitDiv:28, accent:[4], vpad:0.075,
      /* контур корпуса: доли рамки + радиус скругления в долях ширины */
      outline:[0.00,0.00,1.00,1.00,0.165],
      blocks:[
        [0.360,0.026,0.280,0.018],  /* динамический островок */
        [0.090,0.088,0.400,0.030],  /* заголовок экрана */
        [0.090,0.136,0.240,0.016],  /* подзаголовок */
        [0.090,0.186,0.820,0.148],  /* большая карточка */
        [0.090,0.356,0.385,0.082],  /* плитка (акцент) */
        [0.525,0.356,0.385,0.082],  /* плитка */
        [0.090,0.470,0.820,0.034],  /* строки списка */
        [0.090,0.524,0.820,0.034],
        [0.090,0.578,0.820,0.034],
        [0.090,0.632,0.820,0.034],
        [0.090,0.722,0.820,0.005],  /* разделитель над таб-баром */
        [0.100,0.772,0.075,0.030],  /* таб-бар: пять иконок */
        [0.280,0.772,0.075,0.030],
        [0.460,0.772,0.075,0.030],
        [0.640,0.772,0.075,0.030],
        [0.820,0.772,0.075,0.030],
        [0.300,0.952,0.400,0.007]   /* home indicator */
      ]
    },
    {
      name:'tablet', ratio:0.74, unitDiv:52, accent:[5],
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
    },
    {
      /* аналитика: столбцы разной высоты на общей базовой линии. Третий тип
         структуры после «страницы» и «устройства» — данные. */
      name:'chart', ratio:0.60, unitDiv:62, accent:[9],
      blocks:[
        [0.06,0.06,0.30,0.055],   /* заголовок */
        [0.06,0.155,0.18,0.028],  /* подпись */
        [0.74,0.06,0.20,0.028],   /* легенда */
        [0.06,0.875,0.88,0.012],  /* базовая линия */
        [0.09,0.64,0.09,0.22],
        [0.215,0.52,0.09,0.34],
        [0.34,0.58,0.09,0.28],
        [0.465,0.40,0.09,0.46],
        [0.59,0.48,0.09,0.38],
        [0.715,0.30,0.09,0.56],
        [0.84,0.36,0.09,0.50]
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

  /* Доля стороны, на которой частицы угасают к краю — тот же приём, что
     у разделителей .rule, только по всем четырём сторонам. Макет ужат до
     (1 - 2*FADE), чтобы собранная фигура целиком стояла в непрозрачном ядре
     и не притухала по краям. */
  var FADE=0.10;
  /* Горизонтальная зона угасания. На узких экранах она ужимается: там
     надпись упирается в ширину раньше, чем во что-либо ещё, и каждый
     процент бокового поля напрямую уменьшает кегль. FX задаётся в size(). */
  var FX=FADE, FY=FADE;
  /* Узкий экран. На нём кегль надписи мал, и всё, что вокруг неё движется,
     мешает читаемости сильнее, чем на десктопе: та же амплитуда в пикселях
     относительно буквы втрое крупнее. */
  var narrow=false;

  /* Каждая цель несёт свою задержку dl (в долях от 0 до 1): по ней строится
     очередь прилёта. Порядок — слева направо, как читается структура. */
  function stagger(t){
    var min=Infinity,max=-Infinity,i;
    for(i=0;i<t.length;i++){ if(t[i].x<min)min=t[i].x; if(t[i].x>max)max=t[i].x; }
    var d=Math.max(1,max-min);
    for(i=0;i<t.length;i++) t[i].dl=(t[i].x-min)/d*0.75+Math.random()*0.25;
  }

  function buildLayout(def){
    /* Высоким формам (смартфон) тесно в общем поле: они упираются в высоту
       раньше, чем в ширину, и при общем отступе выходят заметно мельче
       остальных структур. vpad позволяет такой форме занять больше по
       вертикали, оставаясь в том же кадре. */
    var vp=def.vpad!==undefined?def.vpad:FADE;
    var maxW=W*(1-FADE*2), maxH=H*(1-vp*2);
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

    stagger(t);
    /* free:0 — вокруг собранного интерфейса лишние частицы гасятся, макет
       должен читаться начисто */
    return {id:def.name, targets:t, unit:unit, kind:'ui', free:0};
  }

  /* ---------- форма-надпись ----------
     Тот же формат целей, что у интерфейсов, только источник — растр глифов.
     Ничего в отрисовке ради текста не меняется: контур букв помечается
     edge:true и попадает в уже существующую ветку «плотнее и мельче». */

  var off=document.createElement('canvas'), octx=off.getContext('2d',{willReadFrequently:true});
  var LINES=['PRODUCT','DESIGNER'];

  function displayFont(){
    var v=getComputedStyle(document.documentElement).getPropertyValue('--display').trim();
    return v||'system-ui,sans-serif';
  }

  function buildText(){
    /* растрируем в половинном разрешении: сетка сэмплинга всё равно грубая,
       а getImageData дешевеет вчетверо */
    var S=0.5;
    var ow=Math.max(1,Math.round(W*S)), oh=Math.max(1,Math.round(H*S));
    off.width=ow; off.height=oh;
    octx.clearRect(0,0,ow,oh);

    /* 600 — реальный потолок Geist (переменный шрифт объявлен как 400..600),
       вес 700 браузер всё равно зажимал до него. Чтобы на телефоне штрих
       набирался не одним квадратом, глиф дополнительно утолщается обводкой:
       начертание остаётся тем же, растёт только толщина линии. */
    /* На узком экране глиф утолщается обводкой, иначе штрих набирается одним
       квадратом и надпись читается пунктиром. Но обводка растёт наружу и
       съедает просвет между буквами: на 375px «DESIGNER» слипался в сплошную
       ленту. Поэтому утолщение и межбуквенное расстояние задаются парой —
       сколько прибавили штриху, столько же примерно вернули в просвет. */
    var narrow=W<720;
    var fam=displayFont(), weight=600;
    var fatten=narrow?0.038:0;
    var track=narrow?0.105:0.02;
    octx.textAlign='center'; octx.textBaseline='alphabetic';

    /* кегль от viewport, а не константой: сначала по ширине самой длинной
       строки, затем ограничиваем высотой двух строк */
    var boxW=W*(1-FX*2)*0.99, boxH=H*(1-FY*2);
    octx.font=weight+' 100px '+fam;
    var wid=0,i;
    for(i=0;i<LINES.length;i++) wid=Math.max(wid,octx.measureText(LINES[i]).width+100*track*(LINES[i].length-1));
    var fs=100*boxW/Math.max(1,wid);
    var lh=1.02;
    if(fs*lh*LINES.length>boxH) fs=boxH/(lh*LINES.length);

    function draw(){
      octx.clearRect(0,0,ow,oh);
      octx.font=weight+' '+(fs*S)+'px '+fam;
      if('letterSpacing' in octx) octx.letterSpacing=(fs*S*track)+'px';
      if(fatten){
        octx.lineWidth=fs*S*fatten;
        octx.lineJoin='round';
        octx.strokeStyle='#000';
      }
      var total=fs*lh*LINES.length*S;
      var top=(oh-total)/2;
      /* letterSpacing вешает просвет и после последней буквы, а textAlign
         центрирует уже вместе с ним — строка уезжала влево на половину шага.
         На прежних 0.02em это было незаметно, на 0.085em уже видно. */
      var cx=ow/2+fs*S*track/2;
      for(var n=0;n<LINES.length;n++){
        /* 0.79 от кегля — оптическая база прописных, чтобы блок стоял по центру */
        var by=top+fs*lh*S*n+fs*S*0.79;
        octx.fillText(LINES[n], cx, by);
        if(fatten) octx.strokeText(LINES[n], cx, by);
      }
    }
    draw();

    var img=octx.getImageData(0,0,ow,oh).data;
    function alphaAt(x,y){
      x=Math.round(x*S); y=Math.round(y*S);
      if(x<0||y<0||x>=ow||y>=oh) return 0;
      return img[(y*ow+x)*4+3];
    }

    /* бюджет целей: главный рычаг производительности. Если сетка дала больше
       квадратов, чем мы готовы рисовать, шаг увеличивается и проход повторяется */
    /* На узких экранах целей больше прежнего: штрих буквы должен набираться
       не одним квадратом, иначе надпись читается как пунктир. */
    var budget=W<720?620:900;
    var step=Math.max(4,fs*0.062);

    function sample(st){
      var out=[], x0=(W-boxW)/2;
      for(var y=0;y<H;y+=st){
        for(var x=x0;x<x0+boxW;x+=st){
          if(alphaAt(x,y)<110) continue;
          /* цель на границе глифа помечается edge и попадает в уже
             существующую ветку отрисовки «плотнее и мельче»: контур сам собой
             читается чётче заливки, плотность внутри букв разная */
          var edge=alphaAt(x-st*0.72,y)<110||alphaAt(x+st*0.72,y)<110||
                   alphaAt(x,y-st*0.72)<110||alphaAt(x,y+st*0.72)<110;
          out.push({x:x,y:y,a:false,edge:edge});
        }
      }
      return out;
    }

    /* Бюджет целей — главный рычаг производительности. Шаг подбирается так,
       чтобы взять от бюджета как можно больше: при слишком крупном шаге штрих
       буквы становится в один квадрат, заливки не остаётся и вся надпись
       вырождается в контур. */
    var t=sample(step), best=null, bestStep=step;
    if(t.length<=budget){ best=t; bestStep=step; }
    for(var pass=0;pass<3;pass++){
      step*=Math.sqrt(t.length/(budget*0.94));
      t=sample(step);
      if(t.length<=budget&&(!best||t.length>best.length)){ best=t; bestStep=step; }
      if(best&&best.length>budget*0.8) break;
    }
    if(best){ t=best; step=bestStep; }

    /* несколько акцентных квадратов — не узор, а вкрапление: надпись
       остаётся частью того же облака, а не отдельным объектом */
    for(i=0;i<4&&t.length;i++) t[Math.floor(Math.random()*t.length)].a=true;

    stagger(t);
    /* free:0 — как и у интерфейсов. Свободное облако вокруг надписи убрано:
       лишние частицы не попадали в очередь на буквы, оставались висеть у места
       воронки серым сгустком и потом расползались по своим орбитам уже поверх
       собранного текста. Читалось это не как жизнь поля, а как впрыск мусора
       после того, как надпись уже готова. */
    return {id:'text', targets:t, unit:Math.max(3,step*0.62), kind:'text', free:0};
  }

  var VPAD=130;  /* насколько поджать облако частиц сверху и снизу */

  function scatter(){
    var a=Math.random()*Math.PI*2;
    /* sqrt даёт равномерное распределение по площади. Раньше показатель был
       >1 и сгущал облако к центру — но центр теперь занят собранной формой,
       и сгущение спорило с ней, перетягивая внимание на середину. Свободные
       частицы должны ровно держать всё поле, а не толпиться в кадре. */
    var r=Math.sqrt(Math.random());
    var ry=Math.max(50,(H-VPAD*2)/2);
    return {x:W/2+Math.cos(a)*r*W*0.62, y:H/2+Math.sin(a)*r*ry*1.02, r:r};
  }

  /* Прозрачность у краёв: 1 в ядре, плавно в 0 к границе канваса.
     smoothstep вместо линейной — иначе на входе в зону виден излом. */
  function edgeAlpha(x,y){
    var fx=W*FX, fy=H*FY;
    if(fx<=0||fy<=0) return 1;
    var k=Math.min(Math.min(x,W-x)/fx, Math.min(y,H-y)/fy);
    if(k>=1) return 1;
    if(k<=0) return 0;
    return k*k*(3-2*k);
  }

  /* ---------- формы и распределение частиц по целям ---------- */

  var UI=[], restForm=null, curForm=null;
  var tStart=0, dlScale=1, gRise=1, nowT=0, ready=false;

  /* Курсор как физическое присутствие в поле. Отталкивание применяется не к
     самой частице, а к её цели: частица продолжает лететь по своему обычному
     лерпу, просто цель на время смещена. Поэтому возврат «примагничиванием»
     получается сам собой, без отдельной пружины и без хранения скоростей. */
  /* Воронка интро. Раньше первый кадр показывал уже разбросанное облако,
     частицы крутились каждая сама по себе, и в момент выдачи целей вращение
     обрывалось — движения «откуда» не было вовсе. Теперь система сначала
     стягивается в одну точку у левого верхнего угла и медленно вращается:
     внутренние кольца быстрее внешних, как в воронке. Оттуда частицы по
     очереди уходят в надпись. */
  var vortex=false, vcx=0, vcy=0, vR=1;

  function vortexGoal(p,t,out){
    var a=p.va+p.vw*t;
    out[0]=vcx+Math.cos(a)*p.vr;
    out[1]=vcy+Math.sin(a)*p.vr*0.86;
  }
  var vg=[0,0];

  var mx=0,my=0,mOn=false,mF=0;
  function pointerAt(e){
    var r=cv.getBoundingClientRect();
    mx=e.clientX-r.left; my=e.clientY-r.top; mOn=true;
  }

  /* Кто куда летит. Наивное соответствие «i-я частица — i-я цель» рвёт
     непрерывность: при смене формы половина квадратов пересекала бы экран
     насквозь. Поэтому цели раздаются по близости: сначала берём частицы,
     ближние к центру композиции, затем сортируем и тех и других по углу и
     сшиваем по порядку. Перелёты получаются короткими, и переход читается
     как перестроение одной структуры, а не как подмена. */
  function assign(F){
    var T=F.targets, n=Math.min(P.length,T.length), i;
    var cx=W/2, cy=H/2;
    var pi=[];
    for(i=0;i<P.length;i++){ P[i].ti=-1; pi.push(i); }
    pi.sort(function(a,b){
      var da=(P[a].x-cx)*(P[a].x-cx)+(P[a].y-cy)*(P[a].y-cy);
      var db=(P[b].x-cx)*(P[b].x-cx)+(P[b].y-cy)*(P[b].y-cy);
      return da-db;
    });
    pi.length=n;
    pi.sort(function(a,b){ return Math.atan2(P[a].y-cy,P[a].x-cx)-Math.atan2(P[b].y-cy,P[b].x-cx); });
    var ti=[];
    for(i=0;i<T.length;i++) ti.push(i);
    ti.sort(function(a,b){ return Math.atan2(T[a].y-cy,T[a].x-cx)-Math.atan2(T[b].y-cy,T[b].x-cx); });
    for(i=0;i<n;i++) P[pi[i]].ti=ti[i];
  }

  /* Каждое перестроение идёт через воронку, а не напрямую из формы в форму.
     Прямой перелёт всегда читался как подмена: половина квадратов шла своей
     короткой хордой, и общего движения не складывалось. Теперь у системы одно
     место, откуда всё берётся и куда всё возвращается — сгусток в левом
     верхнем углу. Структура стягивается в него, подкручивается и вылетает
     обратно уже новой формой.

     Отдельной механики для этого не понадобилось: воронка и очередь вылета
     уже есть в интро. Разница только в том, что раньше они работали один раз,
     а теперь на каждой смене формы.

     HOLD — сколько времени вся система идёт в воронку до того, как откроются
     первые ворота. Без него самые ранние по очереди квадраты уходили бы в
     новую форму, ещё не долетев до сгустка, и стягивания не было видно.
     PULL — за сколько стягивание набирает полную скорость. HOLD чуть больше
     PULL: разгон должен успеть отработать целиком, иначе видна только его
     медленная часть.

     Сам перелёт из шара держим коротким: путь через угол длиннее прямого, и
     растянутый переход оставлял поле пустым — с одним сгустком в углу. Форма
     должна стоять дольше, чем лететь.

     PULL_Q — разброс очереди срыва между ближним к шару квадратом и самым
     дальним. HOLD обязан покрывать всю цепочку: последняя частица трогается на
     PULL_Q, идёт в шар ещё PULL, и только потом открываются первые ворота на
     вылет. Пока HOLD был короче этой суммы, сбор новой формы начинался, когда
     половина квадратов ещё летела в шар: разбор и сбор шли внахлёст и обе фазы
     смазывались. Сверху добавлена короткая пауза — момент, когда шар просто
     крутится собранным. Он и делает две фазы двумя, а не одной. */
  var PULL=1.1, PULL_Q=0.75, SPIN=0.45, HOLD=PULL_Q+PULL+SPIN, dlOff=0, vT=0;

  /* Очередь срыва: чем ближе квадрат к шару, тем раньше его отпускает своя
     структура. Считается на каждом переходе заново — от того, где частица
     стоит прямо сейчас, а не от её места в макете.

     Это и отличает притяжение от перестроения. Пока команда общая, все
     трогаются разом и видно, что формой кто-то управляет. Когда срыв идёт по
     расстоянию, фронт бежит от угла к дальнему краю: сначала осыпается то,
     что рядом с шаром, и только потом снимается противоположная сторона. */
  function pullOrder(){
    var i,d,max=1;
    for(i=0;i<P.length;i++){
      d=Math.hypot(P[i].x-vcx,P[i].y-vcy);
      P[i].pd=d;
      if(d>max) max=d;
    }
    for(i=0;i<P.length;i++) P[i].pd=P[i].pd/max*PULL_Q;
  }

  function setForm(F,slow){
    curForm=F; tStart=nowT;
    /* интро — единственный медленный переход: там воронка уже раскручена и
       держится своим таймером, стягивать нечего. */
    dlScale=slow?1.0:0.52;
    gRise  =slow?0.95:0.68;
    dlOff  =slow?0:HOLD;
    if(!slow&&F){
      vortex=true;
      pullOrder();
      clearTimeout(vT);
      /* Воронка нужна ровно до того, как последний квадрат получит ворота:
         дальше она никого не держит, а лишний флаг только мешал бы курсору и
         парковке. */
      vT=setTimeout(function(){ vortex=false; },(HOLD+dlScale)*1000+150);
    }
    if(F) assign(F);
  }

  function snap(){
    if(!curForm) return;
    var T=curForm.targets;
    for(var i=0;i<P.length;i++){
      var p=P[i]; if(p.ti<0) continue;
      p.x=T[p.ti].x; p.y=T[p.ti].y; p.rot=0;
      p.cur=T[p.ti].edge?0.86:0.72; p.sz=curForm.unit;
    }
  }

  function size(){
    /* На телефонах плотность больше не режется до 1.5: квадрат надписи там
       всего несколько пикселей, и на 1.5 его края размывались сглаживанием —
       буквы читались мягкими и бледными. Квадратов немного, заливка мелкая,
       на 2 это не заметно по кадру. */
    dpr=Math.min(window.devicePixelRatio||1,2);
    var rc=cv.getBoundingClientRect();
    W=Math.max(1,rc.width); H=Math.max(1,rc.height);
    narrow=W<720;
    lastW=Math.round(W); lastH=Math.round(H);
    FX=narrow?0.035:FADE; FY=FADE;
    cv.width=Math.floor(W*dpr); cv.height=Math.floor(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    UI=DEFS.map(buildLayout);
    restForm=buildText();

    var need=restForm.targets.length;
    for(var i=0;i<UI.length;i++) need=Math.max(need,UI[i].targets.length);
    /* Запаса сверх целей больше нет: ни одна форма не показывает свободные
       частицы, и лишние квадраты только висели бы невидимым грузом в каждом
       кадре. Берём ровно столько, сколько нужно самой большой форме. */

    var base=restForm.unit;
    /* воронка живёт у левого верхнего угла и по размеру не спорит с надписью */
    vR=Math.min(W,H)*0.17;
    vcx=W*0.17; vcy=H*0.26;

    var np=[];
    for(var n=0;n<need;n++){
      var old=P[n];
      var home=scatter();
      var vr=vR*(0.10+0.90*Math.pow(Math.random(),0.62));
      /* Лёгкий спад к краю оставлен ради глубины, но заметно слабее прежнего:
         при равномерном облаке сильный спад снова читался бы как ядро. */
      var fall=1-home.r*0.3;
      var o=(0.09+Math.random()*0.2)*fall;
      np.push({
        x:old?old.x:home.x, y:old?old.y:home.y,
        hx:home.x, hy:home.y,
        p1:Math.random()*Math.PI*2, p2:Math.random()*Math.PI*2,
        f1:(0.026+Math.random()*0.034)*1.2,
        f2:(0.016+Math.random()*0.024)*1.2,
        /* размах свободного дрейфа: на узком экране вдвое меньше, иначе
           облако разбредается через всю надпись и та расплывается */
        ax:(34+Math.random()*62)*(narrow?0.5:1),
        ay:(20+Math.random()*32)*(narrow?0.5:1),
        rot:old?old.rot:Math.random()*Math.PI, rs:(Math.random()-0.5)*0.03,
        s:base*(0.7+Math.random()*0.95)*fall,
        o:o, cur:old?old.cur:o, sz:base,
        /* своя скорость подлёта у каждой: строй не приезжает одним фронтом */
        tk:0.05+Math.random()*0.04,
        ti:old?old.ti:-1,
        /* момент срыва в шар; выдаётся заново на каждом переходе */
        pd:0,
        /* место в воронке: показатель <1 сгущает частицы к её центру */
        vr:vr,
        va:Math.random()*Math.PI*2,
        /* угловая скорость падает с радиусом: разница внутренних и внешних
           колец и читается как вращение воронки, а не как карусель */
        vw:1.55/Math.pow(1+vr/(vR*0.42),0.85)
      });
    }
    P=np;

    /* Формы пересобраны — это новые объекты. Текущую надо перевязать по id,
       иначе curForm продолжает ссылаться на выброшенный объект: сравнение
       «мы в форме покоя?» перестаёт совпадать, и возврат к надписи по
       таймеру или уходу курсора отрабатывает вхолостую. Ровно это и
       случалось после того, как загрузился шрифт и формы пересобрались. */
    if(curForm) curForm=formById(curForm.id);
    if(curForm) assign(curForm);
  }

  function formById(id){
    if(id==='text') return restForm;
    for(var i=0;i<UI.length;i++) if(UI[i].id===id) return UI[i];
    return restForm;
  }

  function frame(t,dt){
    nowT=t;
    ctx.clearRect(0,0,W,H);
    var f=dt*60;
    function ease(k){ return k<=0?0:1-Math.pow(1-k,f); }
    /* поворот гасится мягче прежнего: на 0.09 остановка вращения читалась
       как обрыв движения, особенно на первом кадре после интро */
    var kOff=ease(0.026), kRot=ease(0.045), kOp=ease(0.075), kSz=ease(0.09);

    var F=curForm, T=F?F.targets:null, len=T?T.length:0;
    var unit=F?F.unit:0, freeK=F?F.free:1;

    /* «жизнь» формы покоя считается один раз за кадр, не на частицу:
       левитация всей композиции + очень медленное дыхание масштаба */
    var live=F&&F.kind==='text';
    var lx=0,ly=0,br=1,cx=W/2,cy=H/2;
    if(live){
      var amp=narrow?0.45:1;
      lx=Math.sin(t*0.11)*3*amp; ly=Math.sin(t*0.18)*6*amp;
      br=1+Math.sin(t*0.23)*0.006*amp;
    }
    /* микроколебание квадрата внутри буквы: на мелком кегле те же 1.3 px
       съедают заметную долю штриха и буква начинает мылиться */
    var jit=narrow?0.5:1.3;

    /* Присутствие курсора нарастает и спадает плавно: иначе на входе и выходе
       указателя всё поле дёргалось бы разом. */
    mF+=((mOn?1:0)-mF)*ease(0.12);
    /* На собранном интерфейсе сила вдвое меньше: макет должен оставаться
       читаемым, пока по нему ведут курсором. */
    var mR=Math.max(45,Math.min(W,H)*0.11), mR2=mR*mR;
    var mPow=mF*(F&&F.kind==='ui'?0.5:1)*mR*0.5;
    var mAct=mPow>0.5;

    for(var i=0;i<P.length;i++){
      var p=P[i];
      var tgt=(F&&p.ti>-1&&p.ti<len)?T[p.ti]:null;
      var gx,gy,k;

      var g=0, toTarget, inV=false;
      if(tgt){
        /* Ворота: коэффициент лерпа не включается скачком, а нарастает по
           своей кривой после личной задержки. Лерп с растущим k читается как
           разгон и торможение — инерция без отдельной физики и без телепорта. */
        var el=t-tStart-dlOff-tgt.dl*dlScale;
        g=el<=0?0:Math.min(1,el/gRise);
      }

      toTarget=tgt&&!(vortex&&g<=0);
      if(toTarget){
        gx=tgt.x; gy=tgt.y;
        if(live){
          gx=cx+(gx-cx)*br+lx+Math.cos(t*p.f1*0.55+p.p1)*jit;
          gy=cy+(gy-cy)*br+ly+Math.sin(t*p.f2*0.50+p.p2)*jit;
        }
        k=ease(p.tk*g*g*(3-2*g));
      } else if(vortex){
        /* Очередь на вылет ещё не подошла — частицу тянет в воронку.

           Разгон свой у каждой и считается от личного момента срыва p.pd: пока
           очередь не дошла, квадрат стоит совсем неподвижно, потом трогается и
           идёт в угол всё быстрее. Куб от времени, а не линейка: нужен именно
           медленный старт, обычный лерп устроен наоборот — быстрее всего в
           начале, когда до цели далеко, и вяло на подходе.

           Сам срыв не по команде, а по расстоянию: ближние к шару уходят
           первыми, дальние ждут. Тянет не «всем лететь», а само место. */
        var q=Math.min(1,Math.max(0,(t-tStart-p.pd)/PULL));
        vortexGoal(p,t,vg);
        gx=vg[0]; gy=vg[1];
        k=ease(0.16*q*q*q);
        inV=true;
      } else {
        /* Цели в текущей форме не досталось. Раньше такая частица уходила на
           свою «домашнюю» орбиту — точку, разбросанную по всему полю. Видно её
           не было (свободное облако погашено), но она успевала уехать через
           весь кадр, и в следующей форме, где квадратов нужно больше, она
           проявлялась в произвольном месте. Перестроение из-за этого читалось
           не как перестроение, а как новая анимация с чистого листа.

           Поэтому лишние частицы остаются там, где их оставила предыдущая
           структура: слегка покачиваются на месте и ждут. Любая следующая
           форма набирается из точек прошлой, и переход остаётся непрерывным. */
        if(p.px===undefined){ p.px=p.x; p.py=p.y; }
        gx=p.px+Math.cos(t*p.f1+p.p1)*3;
        gy=p.py+Math.sin(t*p.f2+p.p2)*3;
        k=kOff;
      }
      /* точку парковки запоминаем заново каждый раз, когда частица занята:
         отпустят её уже на новом месте, внутри свежей структуры */
      if(toTarget||vortex) p.px=undefined;

      if(mAct){
        var dx=gx-mx, dy=gy-my, d2=dx*dx+dy*dy;
        if(d2<mR2&&d2>0.01){
          var d=Math.sqrt(d2), u=1-d/mR;
          var push=u*u*mPow;
          gx+=dx/d*push; gy+=dy/d*push;
        }
      }

      p.x+=(gx-p.x)*k; p.y+=(gy-p.y)*k;

      /* Плотность, размер и поворот берутся от цели только когда частица
         действительно летит к ней. Пока она ждёт своей очереди в воронке, она
         остаётся частью облака — поэтому надпись набирает вес постепенно, по
         мере прилёта, а вращение гаснет не разом, а у каждой в свой момент. */
      if(toTarget){ p.rot+=(0-p.rot)*kRot; } else { p.rot+=p.rs*f; }

      /* В воронке частица приглушена, но видима: свободного облака вокруг форм
         нет, и на общем freeK=0 стягивание читалось бы как исчезновение формы
         в пустоту с последующим появлением новой. Сгусток должен быть виден —
         он и есть то место, откуда всё берётся. */
      var wantOp = toTarget ? (tgt.edge?0.86:0.72) : (inV?0.5:p.o*freeK);
      p.cur += (wantOp-p.cur)*kOp;

      var wantSz = toTarget ? (tgt.edge?unit*0.92:unit) : (inV?p.s*0.8:p.s);
      p.sz += (wantSz-p.sz)*kSz;

      var a=p.cur*edgeAlpha(p.x,p.y);
      if(a<0.012) continue;

      ctx.fillStyle=(toTarget&&tgt.a)
        ? 'rgba(228,87,58,'+Math.min(0.95,a+0.12).toFixed(3)+')'
        : 'rgba(11,11,12,'+a.toFixed(3)+')';

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

  /* Обновление структуры: пары частиц внутри собранной формы меняются
     местами — каждая летит на место другой. Раньше квадрат отпускался в
     облако и слот оставался пустым на время полёта: при шести одновременных
     отпусканиях это читалось как дыры, а не как жизнь. При обмене ни одна
     позиция не пустует, но структура всё время в лёгком движении.

     Работает для любой формы, а не только для надписи: свойства квадрата
     (плотность, размер, акцентный цвет) заданы целью, а не частицей, поэтому
     обмен целями ничего не ломает — в интерфейсе так же не видно, какая
     именно частица стоит в конкретной точке макета. */
  /* Интервал свой у каждого типа формы. Надпись — крупные буквы с большим
     запасом квадратов, движение в ней читается как дыхание. Интерфейс мельче
     и строже, там та же частота выглядела бы как рябь по макету. */
  var SWAPS=6, SWAP_TEXT=1500, SWAP_UI=3000, swapT=0;

  function swapLoop(){
    refresh();
    swapT=setTimeout(swapLoop, curForm&&curForm.kind==='ui'?SWAP_UI:SWAP_TEXT);
  }

  function refresh(){
    if(!curForm||P.length<2) return;
    var pool=[],i;
    for(i=0;i<P.length;i++) if(P[i].ti>-1) pool.push(i);
    if(pool.length<2) return;
    for(i=0;i<SWAPS;i++){
      var a=pool[Math.floor(Math.random()*pool.length)];
      var b=pool[Math.floor(Math.random()*pool.length)];
      if(a===b) continue;
      var tmp=P[a].ti; P[a].ti=P[b].ti; P[b].ti=tmp;
    }
  }

  /* ---------- взаимодействие ---------- */

  var uiIndex=-1;
  function atRest(){ return curForm===restForm; }

  /* Система живёт сама: надпись и интерфейсы сменяют друг друга по кругу,
     каждое состояние держится CYCLE. Сборка по наведению убрана целиком —
     она давала неразрешимый конфликт с автовозвратом: курсор, оставшийся
     над канвасом, собирал интерфейс заново на первом же микродвижении, и
     возврат к надписи было невозможно увидеть. Осталось одно явное действие
     — клик, он листает интерфейсы. Отталкивание частиц курсором к состояниям
     отношения не имеет и работает как раньше. */
  /* Все состояния держатся одинаково: система дышит ровно с первого показа. */
  var CYCLE_FIRST=10000, CYCLE=10000, cycleT=0, cycles=0, clickable=false;

  function toUI(){
    if(!UI.length) return;
    uiIndex=(uiIndex+1)%UI.length;
    setForm(UI[uiIndex]);
  }
  function schedule(){
    clearTimeout(cycleT);
    cycleT=setTimeout(tick,cycles?CYCLE:CYCLE_FIRST);
  }
  function tick(){
    cycles++;
    atRest()?toUI():setForm(restForm);
    /* кликать можно только после того, как первый интерфейс собрался:
       прерывать первое перестроение нельзя */
    if(!clickable) setTimeout(function(){ clickable=true; },1200);
    schedule();
  }

  var touch=window.matchMedia('(hover: none)').matches;

  cv.setAttribute('tabindex','0');
  /* Глайд — только для мыши. На тач-устройствах его нет совсем: палец при
     скролле непрерывно шлёт pointermove по канвасу, частицы всё время
     разлетались из-под пальца, а сам жест приходил ещё и как клик — форма
     перещёлкивалась на каждом касании. Указатель здесь не инструмент. */
  if(!touch){
    cv.addEventListener('pointermove',pointerAt);
    cv.addEventListener('pointerleave',function(){ mOn=false; });
  }

  /* клик листает структуры дальше и заново заводит цикл */
  function advance(e){
    if(!clickable) return;
    /* сюда попадают только мышь и клавиатура: на тач-устройствах
       обработчика нет, и проверка на touch здесь была бы лишней */
    if(e) pointerAt(e);
    toUI();
    schedule();
  }

  /* На тач-устройствах канвас не реагирует на касания вообще.

     Отличить тап от скролла здесь надёжно не выходит: как только браузер
     решает, что жест это прокрутка, он забирает указатель себе, перестаёт
     слать pointermove и присылает pointercancel, а click всё равно прилетает
     — в том числе по инерции, уже после отрыва пальца. Гарды по смещению,
     по факту прокрутки и по карантину времени отсеивали часть случаев, но не
     все, и каждый пропущенный скролл дёргал форму.

     Тап при этом ничего не добавлял: автоцикл и так меняет структуру каждые
     десять секунд. Цена возможности пролистать вручную оказалась выше пользы,
     поэтому её здесь просто нет. На десктопе клик работает как раньше. */
  if(!touch) cv.addEventListener('click',advance);
  cv.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){ e.preventDefault(); advance(); }
  });

  /* Мобильный скролл сам по себе меняет высоту viewport'а: браузер прячет и
     показывает адресную строку. Каждое такое событие приходит как resize, а
     size() пересобирает формы и заново раздаёт цели — все частицы разом
     уезжают на новые места. Со стороны это читается как самопроизвольное
     «перещёлкивание» формы раз в секунду, пока палец ведёт страницу.

     Поэтому реагируем только на смену ширины и на крупные изменения высоты.
     Порог берём с запасом на панели браузера: они занимают заметно меньше
     четверти экрана, а настоящий поворот устройства всегда меняет ширину. */
  var rt, lastW=0, lastH=0;
  function viewportChanged(){
    var rc=cv.getBoundingClientRect();
    var w=Math.round(rc.width), h=Math.round(rc.height);
    if(!lastW){ lastW=w; lastH=h; return true; }
    var same=(w===lastW)&&Math.abs(h-lastH)<Math.max(120,lastH*0.25);
    lastW=w; lastH=h;
    return !same;
  }
  window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){
    if(!viewportChanged()) return;
    size();
    if(ready&&atRest()) snap();
  },150);});

  /* ---------- запуск ---------- */

  var SEEN='hero-intro';
  function seen(){ try{ return sessionStorage.getItem(SEEN)==='1'; }catch(e){ return false; } }
  function markSeen(){ try{ sessionStorage.setItem(SEEN,'1'); }catch(e){} }

  function init(){
    size();

    if(reduce){
      var T=restForm.targets,u=restForm.unit;
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<T.length;i++){
        var e=edgeAlpha(T[i].x,T[i].y);
        ctx.fillStyle=T[i].a?'rgba(228,87,58,'+(0.92*e).toFixed(3)+')'
                            :'rgba(11,11,12,'+((T[i].edge?0.86:0.72)*e).toFixed(3)+')';
        ctx.fillRect(T[i].x-u/2,T[i].y-u/2,u,u);
      }
      return;
    }

    var startTs=null, prevTs=null, running=false, rafId=0, visible=true, kicked=false;
    var wantRest=false, lastT=0;

    function loop(ts){
      /* Время продолжается с того места, где остановилось. При отсчёте заново
         tStart оставался бы от прошлого запуска: задержки очереди уходили бы
         в минус, ворота лерпа не открывались, и форма замирала на полпути. */
      if(startTs===null){ startTs=ts-lastT*1000; prevTs=ts; }
      var dt=Math.min(0.1,(ts-prevTs)/1000);
      prevTs=ts;
      var t=(ts-startTs)/1000;
      lastT=t; nowT=t;

      /* Пока экран был вне поля зрения, кадры не шли: перестроение назначаем
         здесь, на первом же кадре после возврата, иначе задержки очереди
         отсчитывались бы от устаревшего времени и структура «телепортнулась» бы. */
      if(wantRest){ wantRest=false; mOn=false; setForm(restForm); schedule(); }

      if(!kicked){
        kicked=true;
        if(seen()){
          /* повторное открытие: структура уже существует, интро не повторяем */
          nowT=t; setForm(restForm); snap(); ready=true; schedule();
        } else {
          /* Первое открытие. Система стягивается в воронку у левого верхнего
             угла и раскручивается, затем оттуда по очереди уходит в надпись.
             Цикл заводится только после того, как надпись собралась целиком:
             первое перестроение прервать нельзя. */
          vortex=true;
          /* Пауза до выдачи целей обязана покрывать всё стягивание: PULL —
             сам перелёт в шар, SPIN — короткий момент, когда сгусток просто
             крутится собранным. На 850 мс разгон (кубический, нарочно вялый
             в начале) успевал пройти меньше половины, и надпись начинала
             набираться из ещё летящего облака — двух фаз не читалось. */
          setTimeout(function(){
            setForm(restForm,true);
            markSeen();
            setTimeout(function(){
              /* воронка больше не нужна: к этому моменту очередь дошла до
                 всех, а свободные частицы расходятся по своим орбитам */
              vortex=false; ready=true; schedule();
            },1900);
          },(PULL+SPIN)*1000);
        }
      }

      frame(t,dt);
      rafId=requestAnimationFrame(loop);
    }
    function start(){
      if(running) return;
      running=true; prevTs=null; startTs=null;
      if(ready) schedule();
      rafId=requestAnimationFrame(loop);
    }
    function stop(){
      if(!running) return;
      running=false; cancelAnimationFrame(rafId);
      /* без кадров цикл смены форм не имеет смысла: иначе за время в фоне
         накопились бы перестроения, которых никто не видел */
      clearTimeout(cycleT);
    }
    function sync(){ (visible && !document.hidden) ? start() : stop(); }

    swapLoop();

    if('IntersectionObserver' in window){
      new IntersectionObserver(function(e){
        visible=e[0].isIntersecting;
        /* пролистали первый экран — система возвращается в форму покоя,
           и при возврате наверх снова видно PRODUCT DESIGNER */
        if(!visible&&ready) wantRest=true;
        sync();
      },{threshold:0}).observe(cv);
    }
    document.addEventListener('visibilitychange',sync);
    sync();
  }

  /* до загрузки --display метрики берутся от фолбэка и надпись «поедет»:
     пересобираем формы, когда шрифт готов */
  init();
  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(function(){
      if(reduce){ init(); return; }
      size();
      if(curForm) { assign(curForm); if(ready&&atRest()) snap(); }
    });
  }
})();
