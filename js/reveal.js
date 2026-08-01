/* Появление блоков при прокрутке — ровно один раз за загрузку страницы.
   Скрывающие стили навешивает CSS по классу js-rv на <html> (его ставит
   короткий скрипт в <head>), поэтому без JS ничего не прячется и мигания
   «показали — спрятали — показали» не будет.

   Список селекторов продублирован в base.css (блок «появление при
   прокрутке») — правим в двух местах или не правим вовсе. */
(function(){
  var root=document.documentElement;
  if(!root.classList.contains('js-rv')) return;

  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEL='.chead .brief, .chead .meta, .labelrow, .stub__t, .lead,'+
          '.phases > div, .insights > div, .jtbd__card, .fact, .shot,'+
          '.tbl, .claim, .note, .about__grid, .project, .contact';

  var els=[].slice.call(document.querySelectorAll(SEL));

  /* нет наблюдателя или человек просил меньше движения — просто показываем */
  if(reduce || !('IntersectionObserver' in window)){
    root.classList.remove('js-rv');
    return;
  }

  /* соседи по одному родителю выезжают лесенкой, а не разом */
  var counts=[];
  function indexIn(parent){
    for(var i=0;i<counts.length;i++){
      if(counts[i][0]===parent) return counts[i][1]++;
    }
    counts.push([parent,1]);
    return 0;
  }
  els.forEach(function(el){
    var n=indexIn(el.parentNode);
    if(n) el.style.transitionDelay=Math.min(n,3)*70+'ms';
    el.classList.add('rv');
  });

  function show(el){
    el.classList.add('rv--in');
    io.unobserve(el);                /* больше не следим — эффект одноразовый */
  }

  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting) show(e.target); });
  },{rootMargin:'0px 0px -10% 0px', threshold:0.04});

  els.forEach(function(el){ io.observe(el); });

  /* Страховка: то, что уже попало в первый экран, показываем сами, не дожидаясь
     наблюдателя. Если он почему-то не отработает (фоновая вкладка на момент
     загрузки, экзотический движок), верх страницы всё равно не останется
     пустым — а это единственный по-настоящему дорогой сценарий отказа. */
  setTimeout(function(){
    els.forEach(function(el){
      if(el.classList.contains('rv--in')) return;
      var r=el.getBoundingClientRect();
      if(r.top<window.innerHeight && r.bottom>0) show(el);
    });
  },120);
})();
