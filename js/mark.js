/* Акцент на ключевой фразе — каретка печатает текст.
   Стили и объяснение приёма — base.css, блок «акцент на ключевой фразе».
   Как применять — docs/ACCENT_MARK.md.

   Здесь три вещи: разбивка фразы на слова, расчёт темпа и запуск фаз.

   Модуль сам решает, трогать ли фразу вообще. Если он не отработал, в
   разметке остаётся обычный <span class="mark"> с видимым текстом — маску
   навешивает только он, классом is-armed. Это главное правило этого файла:
   скрывать фразу можно ровно настолько, насколько мы уверены, что сумеем
   её показать. */
(function(){
  var els=[].slice.call(document.querySelectorAll('.mark'));
  if(!els.length) return;

  /* Просили меньше движения или наблюдателя нет — не трогаем ничего.
     Фраза остаётся обычным текстом, эффекта просто не будет. */
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(!('IntersectionObserver' in window)) return;

  /* --- разбивка на слова ---
     Пробелы кладём отдельными текстовыми узлами, а не внутрь слов: перенос
     строк должен работать ровно так же, как в обычном тексте. */
  els.forEach(function(el){
    var parts=el.textContent.split(/(\s+)/);
    el.textContent='';
    parts.forEach(function(p){
      if(!p) return;
      if(/^\s+$/.test(p)){ el.appendChild(document.createTextNode(p)); return; }
      var w=document.createElement('span');
      w.className='mark__w';
      w.textContent=p;
      el.appendChild(w);
    });
    el.classList.add('is-armed');   /* с этого момента фраза скрыта маской */
  });

  /* Темп раздаём пропорционально ширине слова: длинное печатается дольше
     короткого, и каретка идёт ровно. Считаем в момент запуска, а не заранее,
     потому что ширины зависят от кегля, ширины окна и подгрузки шрифта. */
  function pace(el,total){
    var ws=[].slice.call(el.querySelectorAll('.mark__w'));
    var sum=0, widths=ws.map(function(w){ var x=w.offsetWidth; sum+=x; return x; });
    if(!sum) return;
    var acc=0;
    ws.forEach(function(w,i){
      w.style.setProperty('--w-dur',(widths[i]/sum*total).toFixed(0)+'ms');
      w.style.setProperty('--w-del',(acc/sum*total).toFixed(0)+'ms');
      acc+=widths[i];
    });
  }

  function ms(el,name,fallback){
    var v=parseFloat(getComputedStyle(el).getPropertyValue(name));
    return isNaN(v)?fallback:v;
  }

  function play(el){
    var tIn=ms(el,'--mark-in',220),
        tBlink=ms(el,'--mark-blink',590),
        tWrite=ms(el,'--mark-write',750);
    pace(el,tWrite);

    el.classList.add('is-cursor');
    setTimeout(function(){
      el.classList.remove('is-cursor');
      el.classList.add('is-blink');
    },tIn);
    setTimeout(function(){
      el.classList.remove('is-blink');
      el.classList.add('is-writing');
    },tIn+tBlink);
    setTimeout(function(){
      el.classList.remove('is-writing');
      el.classList.add('is-done');
    },tIn+tBlink+tWrite);
  }

  function show(el){
    if(el.dataset.markDone) return;
    el.dataset.markDone='1';
    io.unobserve(el);               /* эффект одноразовый за загрузку */
    play(el);
  }

  /* Полоса чтения: верхние 25% и нижние 30% экрана не в счёт — печать должна
     начинаться там, где фразу действительно читают. */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ show(e.target); return; }
      /* Пролистали рывком мимо — ждать второго захода нечего, иначе фраза
         останется скрытой и в предложении будет дыра. */
      if(e.boundingClientRect.top<0) show(e.target);
    });
  },{rootMargin:'-25% 0px -30% 0px'});

  els.forEach(function(el){ io.observe(el); });

  /* Страховка: если через 6 секунд что-то так и не проигралось, а оно уже
     на экране — открываем без анимации. Скрытая фраза — сломанное
     предложение, это дороже любого несработавшего эффекта. */
  setTimeout(function(){
    els.forEach(function(el){
      if(el.dataset.markDone) return;
      var r=el.getBoundingClientRect();
      if(r.top<window.innerHeight && r.bottom>0){
        el.dataset.markDone='1';
        io.unobserve(el);
        el.classList.add('is-done');
      }
    });
  },6000);
})();
