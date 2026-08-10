/* Сравнение «было / стало» прямо на аннотированном макете.
   Левая часть — старый экран, правая — новый. Аннотации живут на новом,
   поэтому шторка не просто сравнивает, а открывает их: точка появляется
   ровно тогда, когда шторка до неё дошла (обработчик в annotations.js).

   Стартуем на «было» во весь кадр и при появлении блока в зоне видимости
   сами уводим шторку влево: старый экран уезжает, новый занимает его место.
   Читатель видит подмену, а не готовый результат, и заодно понимает, что
   шторку можно тянуть. */
(function(){
  var box=document.getElementById('cmp');
  if(!box) return;

  var bar=box.querySelector('.cmp__bar');
  if(!bar) return;

  var START=100, REST=22, RIDE=1700;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var pos=START, dragging=false, raf=0;

  function set(p){
    pos=Math.max(0,Math.min(100,p));
    box.style.setProperty('--pos',pos.toFixed(2)+'%');
    box.dataset.pos=pos.toFixed(2);
    bar.setAttribute('aria-valuenow',Math.round(pos));
    /* подпись убираем, только когда её сторона почти схлопнулась: на рабочих
       70% обе стороны ещё широкие, и обе метки должны быть на месте */
    box.classList.toggle('is-hide-before',pos<18);
    box.classList.toggle('is-hide-after',pos>88);
    document.dispatchEvent(new CustomEvent('cmp:pos',{detail:{pos:pos}}));
  }

  function stopRide(){ if(raf){ cancelAnimationFrame(raf); raf=0; } }

  /* плавный проезд до нужной точки */
  function rideTo(target,dur){
    stopRide();
    if(reduce){ set(target); return; }
    var from=pos, t0=null;
    function frame(ts){
      if(t0===null) t0=ts;
      var k=Math.min(1,(ts-t0)/dur);
      var e=1-Math.pow(1-k,3);              /* easeOutCubic */
      set(from+(target-from)*e);
      raf = k<1 ? requestAnimationFrame(frame) : 0;
    }
    raf=requestAnimationFrame(frame);
  }

  function fromPointer(e){
    var r=box.getBoundingClientRect();
    if(!r.width) return;
    set((e.clientX-r.left)/r.width*100);
  }

  box.addEventListener('pointerdown',function(e){
    /* клик по точке аннотации шторку не двигает */
    if(e.target.closest('.hs')) return;
    stopRide();
    dragging=true;
    try{ box.setPointerCapture(e.pointerId); }catch(err){}
    fromPointer(e);
    e.preventDefault();          /* иначе браузер начнёт выделять картинку */
  });
  box.addEventListener('pointermove',function(e){ if(dragging) fromPointer(e); });
  box.addEventListener('pointerup',function(){ dragging=false; });
  box.addEventListener('pointercancel',function(){ dragging=false; });

  /* с клавиатуры — как у обычного слайдера */
  bar.addEventListener('keydown',function(e){
    var step=e.shiftKey?10:2;
    if(e.key==='ArrowLeft'){ stopRide(); set(pos-step); }
    else if(e.key==='ArrowRight'){ stopRide(); set(pos+step); }
    else if(e.key==='Home'){ stopRide(); set(0); }
    else if(e.key==='End'){ stopRide(); set(100); }
    else return;
    e.preventDefault();
  });

  /* клик по ручке не должен считаться «кликом мимо» для аннотаций */
  bar.addEventListener('click',function(e){ e.stopPropagation(); });

  /* перелистывание аннотаций стрелками: если следующая точка ещё закрыта
     старым экраном, отводим шторку сами, иначе кнопка выглядит сломанной */
  document.addEventListener('cmp:reveal',function(e){
    var need=(e.detail&&e.detail.x||100)-8;
    if(pos>need) rideTo(Math.max(0,Math.min(REST,need)),420);
  });

  set(START);

  /* авто-проезд — один раз, когда блок появился на экране */
  var rode=false;
  function ride(){
    if(rode) return;
    rode=true;
    rideTo(REST,RIDE);
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(en){
      en.forEach(function(x){
        if(x.isIntersecting){ io.disconnect(); setTimeout(ride,260); }
      });
    },{threshold:.45});
    io.observe(box);
  } else {
    ride();
  }
})();
