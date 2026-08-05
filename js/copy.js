/* Копирование почты по кнопке рядом с адресом.

   Сам адрес остаётся обычной mailto-ссылкой: клик по нему открывает готовое
   письмо. Кнопка — отдельный служебный жест, она ничего не открывает, только
   кладёт адрес в буфер и на полторы секунды подменяет подсказку. */
(function(){
  var nodes=document.querySelectorAll('[data-copy]');
  if(!nodes.length) return;

  /* Clipboard API работает только в защищённом контексте: при открытии
     страницы с диска его нет, и без запасного пути кнопка была бы мёртвой. */
  function put(text){
    if(navigator.clipboard&&window.isSecureContext){
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function(res,rej){
      var ta=document.createElement('textarea');
      ta.value=text;
      ta.setAttribute('readonly','');
      ta.style.position='fixed'; ta.style.top='-1000px'; ta.style.opacity='0';
      document.body.appendChild(ta);
      ta.select();
      var ok=false;
      try{ ok=document.execCommand('copy'); }catch(e){ ok=false; }
      document.body.removeChild(ta);
      ok?res():rej();
    });
  }

  for(var i=0;i<nodes.length;i++){
    (function(btn){
      var idle=btn.getAttribute('data-tip')||'Копировать', t=0;

      btn.addEventListener('click',function(){
        put(btn.getAttribute('data-copy')).then(function(){
          done('Почта скопирована');
        },function(){
          /* не получилось — честно говорим об этом, а не молчим */
          done('Не удалось');
        });
      });

      function done(msg){
        clearTimeout(t);
        btn.setAttribute('data-tip',msg);
        btn.classList.add('is-done');
        t=setTimeout(function(){
          btn.classList.remove('is-done');
          btn.setAttribute('data-tip',idle);
        },1600);
      }
    })(nodes[i]);
  }
})();
