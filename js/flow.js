/* Пошаговый разбор флоу: слева лента шагов, справа закреплённый экран.
   Клик по шагу подменяет экран. Форма повторяет то, что делает сама фича, —
   историю изменений, где каждая запись остаётся на месте. */
(function(){
  var blocks=document.querySelectorAll('[data-flow]');
  if(!blocks.length) return;

  [].forEach.call(blocks,function(root){
    var steps=[].slice.call(root.querySelectorAll('.flow__step'));
    var shots=[].slice.call(root.querySelectorAll('.flow__screen img'));
    if(!steps.length||!shots.length) return;

    var cur=-1;

    function go(i){
      if(i===cur||i<0||i>=steps.length) return;
      cur=i;
      steps.forEach(function(s,n){
        var on=n===i;
        s.classList.toggle('on',on);
        s.setAttribute('aria-selected',on?'true':'false');
        s.tabIndex = on ? 0 : -1;
      });
      shots.forEach(function(img,n){ img.classList.toggle('on',n===i); });
    }

    steps.forEach(function(s,i){
      s.addEventListener('click',function(){ go(i); });
      /* стрелками — как по обычному списку вкладок */
      s.addEventListener('keydown',function(e){
        var n=null;
        if(e.key==='ArrowDown'||e.key==='ArrowRight') n=Math.min(steps.length-1,i+1);
        else if(e.key==='ArrowUp'||e.key==='ArrowLeft') n=Math.max(0,i-1);
        else if(e.key==='Home') n=0;
        else if(e.key==='End') n=steps.length-1;
        else return;
        e.preventDefault();
        go(n);
        steps[n].focus();
      });
    });

    go(0);
  });
})();
