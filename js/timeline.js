/* Шкала сделки в кейсе Nearby: запускает отрисовку, когда блок попадает в кадр.
   Один раз за загрузку — повторный проезд ничего не перезапускает. */
(function () {
  var els = document.querySelectorAll('.tl');
  if (!els.length) return;

  // Без IntersectionObserver показываем сразу: содержание важнее эффекта.
  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < els.length; i++) els[i].classList.add('is-in');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      entries[i].target.classList.add('is-in');
      io.unobserve(entries[i].target);
    }
  }, {
    // Стартуем, когда видна нижняя треть блока: линия должна рисоваться
    // на глазах, а не оказаться дорисованной до того, как читатель дойдёт.
    rootMargin: '0px 0px -25% 0px'
  });

  for (var j = 0; j < els.length; j++) io.observe(els[j]);
})();
