(function(){
  var stage=document.getElementById('annoStage');
  if(!stage) return;
  var hint=document.getElementById('annoHint');
  var prev=document.getElementById('annoPrev');
  var next=document.getElementById('annoNext');
  var mob=document.getElementById('annoMobile');

  var DATA=[
    { x:27, y:20,
      insight:'Пользователь приходит в систему за оценкой состояния, а не за изучением структуры.',
      solution:'Infrastructure Health: четыре ключевых показателя с пометкой, что именно не так — сразу на входе.' },
    { x:43, y:3.5,
      insight:'Человек заранее знает, что ищет, но вынужден идти в обход через навигацию и разделы.',
      solution:'Глобальный поиск по IP, имени, VLAN и тегу — с любого известного параметра, а не только по точному названию.' },
    { x:50, y:50,
      insight:'При инциденте информацию приходится собирать вручную из нескольких источников.',
      solution:'Alerts, Audit Log и Capacity на одном уровне: что случилось, кто менял конфиг и насколько загружены стойки.' },
    { x:52, y:85,
      insight:'Пользователи возвращаются к одним и тем же объектам и повторяют одни и те же действия.',
      solution:'Continue working и Quick actions: последние объекты и частые операции в один клик, без навигации.' }
  ];

  var cur=0, spots=[], tips=[];

  function tipHTML(d){
    return '<p class="tip__k">Инсайт из интервью</p>'+
           '<p class="tip__t">'+d.insight+'</p>'+
           '<p class="tip__k2">Как решено</p>'+
           '<p class="tip__t2">'+d.solution+'</p>';
  }

  DATA.forEach(function(d,i){
    var b=document.createElement('button');
    b.type='button'; b.className='hs'; b.textContent=(i+1);
    b.style.left=d.x+'%'; b.style.top=d.y+'%';
    b.setAttribute('aria-label','Аннотация '+(i+1)+' из '+DATA.length);
    b.addEventListener('click',function(){ go(i); });
    stage.appendChild(b); spots.push(b);

    var t=document.createElement('div');
    t.className='tip'; t.innerHTML=tipHTML(d);
    /* сторона выноски — чтобы не уезжала за край */
    var right = d.x>52;
    var bottom = d.y>58;
    t.style.left = right ? 'auto' : 'calc('+d.x+'% + 26px)';
    t.style.right = right ? 'calc('+(100-d.x)+'% + 26px)' : 'auto';
    t.style.top = bottom ? 'auto' : 'calc('+d.y+'% - 10px)';
    t.style.bottom = bottom ? 'calc('+(100-d.y)+'% - 10px)' : 'auto';
    stage.appendChild(t); tips.push(t);
  });

  var mobTip=document.createElement('div');
  mobTip.className='tip';
  mob.appendChild(mobTip);

  function go(i){
    cur=(i+DATA.length)%DATA.length;
    spots.forEach(function(b,n){ b.classList.toggle('on', n===cur); });
    tips.forEach(function(t,n){ t.classList.toggle('on', n===cur); });
    mobTip.innerHTML=tipHTML(DATA[cur]);
    hint.textContent=(cur+1)+' / '+DATA.length;
  }

  prev.addEventListener('click',function(){ go(cur-1); });
  next.addEventListener('click',function(){ go(cur+1); });

  go(0);
})();

(function(){
  var wrap=document.getElementById('caveat');
  if(!wrap) return;
  var btn=document.getElementById('caveatBtn');
  function toggle(open){
    wrap.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',open?'true':'false');
  }
  btn.addEventListener('click',function(){ toggle(!wrap.classList.contains('open')); });
  wrap.addEventListener('mouseenter',function(){ toggle(true); });
})();
