/* Пошаговый разбор флоу: слева лента шагов, справа закреплённый экран.
   Шаг переключается сам по мере прокрутки — на всех ширинах, не только на
   мобилке. Раньше на десктопе экран менялся только по клику, и это был
   скрытый интерактив: большинство просто пролистывало флоу, не догадавшись,
   что по шагам надо тыкать. Клик и стрелки остались как способ вернуться.
   Форма повторяет то, что делает сама фича, — историю изменений, где каждая
   запись остаётся на месте. */
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

    /* Активен последний шаг, чей верх пересёк полосу чтения — она проходит
       ниже закреплённой картинки. Листаешь — картинка меняется сама. */
    function stepAtLine(){
      var line=window.innerHeight*0.55, best=0;
      for(var i=0;i<steps.length;i++){
        if(steps[i].getBoundingClientRect().top<=line) best=i;
      }
      return best;
    }
    root._stepAtLine=stepAtLine;      /* точка входа для проверки */

    var ticking=false;
    window.addEventListener('scroll',function(){
      if(ticking) return;
      ticking=true;
      requestAnimationFrame(function(){ ticking=false; go(stepAtLine()); });
    },{passive:true});

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
