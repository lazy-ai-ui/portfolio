/* Сравнение «было / стало»: шторка, которую тянут мышью, пальцем или стрелками.
   Левая часть — старый экран, правая — новый. */
(function(){
  var box=document.getElementById('cmp');
  if(!box) return;

  var stage=box.querySelector('.cmp__stage');
  var bar=box.querySelector('.cmp__bar');
  if(!stage||!bar) return;

  var pos=50, dragging=false;

  function set(p){
    pos=Math.max(0,Math.min(100,p));
    box.style.setProperty('--pos',pos.toFixed(2)+'%');
    bar.setAttribute('aria-valuenow',Math.round(pos));
  }

  function fromPointer(e){
    var r=stage.getBoundingClientRect();
    if(!r.width) return;
    set((e.clientX-r.left)/r.width*100);
  }

  stage.addEventListener('pointerdown',function(e){
    dragging=true;
    if(stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
    fromPointer(e);
    e.preventDefault();          /* иначе браузер начнёт выделять картинку */
  });
  stage.addEventListener('pointermove',function(e){ if(dragging) fromPointer(e); });
  stage.addEventListener('pointerup',function(){ dragging=false; });
  stage.addEventListener('pointercancel',function(){ dragging=false; });

  /* с клавиатуры — как у обычного слайдера */
  bar.addEventListener('keydown',function(e){
    var step=e.shiftKey?10:2;
    if(e.key==='ArrowLeft'){ set(pos-step); }
    else if(e.key==='ArrowRight'){ set(pos+step); }
    else if(e.key==='Home'){ set(0); }
    else if(e.key==='End'){ set(100); }
    else return;
    e.preventDefault();
  });

  /* клик по ручке не должен считаться «кликом мимо» для аннотаций */
  bar.addEventListener('click',function(e){ e.stopPropagation(); });

  set(50);
})();
