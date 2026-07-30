(function(){
  var bar=document.getElementById('navbar');
  if(!bar) return;
  var last=window.pageYOffset||0, ticking=false;
  var DELTA=8, TOP_SAFE=90;

  function update(){
    var y=window.pageYOffset||0;
    var diff=y-last;

    if(y<=TOP_SAFE){
      bar.classList.remove('hidden');
    } else if(Math.abs(diff)>DELTA){
      if(diff>0) bar.classList.add('hidden');
      else bar.classList.remove('hidden');
    }
    last=y;
    ticking=false;
  }

  window.addEventListener('scroll',function(){
    if(!ticking){ ticking=true; requestAnimationFrame(update); }
  },{passive:true});

  /* при фокусе с клавиатуры навбар всегда показан */
  bar.addEventListener('focusin',function(){ bar.classList.remove('hidden'); });
})();
