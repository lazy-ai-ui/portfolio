/* Свитчер контента в кейсе Nearby: вкладки переключают панель на месте.
   Разметка уже валидна без JS — первая панель видима, остальные скрыты
   атрибутом hidden, поэтому при отключённом JS блок читается как обычный
   текст с одним интервью. */
(function () {
  var sws = document.querySelectorAll('.sw');
  if (!sws.length) return;

  function init(sw) {
    var box = sw.querySelector('.sw__tabs');
    var tabs = sw.querySelectorAll('.sw__tab');
    if (!box || !tabs.length) return;

    var current = -1;

    // Подложка активной вкладки: переезжает вместо перекраски, как пилюля
    // нижней навигации.
    var pill = document.createElement('span');
    pill.className = 'sw__pill no-anim';
    pill.setAttribute('aria-hidden', 'true');
    box.insertBefore(pill, box.firstChild);

    function movePill() {
      var tab = tabs[current];
      if (!tab) return;
      pill.style.width = tab.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + (tab.offsetLeft - box.clientLeft) + 'px)';
      pill.classList.add('on');
    }

    function select(idx, moveFocus) {
      current = idx;
      for (var i = 0; i < tabs.length; i++) {
        var on = i === idx;
        var panel = document.getElementById(tabs[i].getAttribute('aria-controls'));
        tabs[i].classList.toggle('is-on', on);
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
        // Роving tabindex: в группе вкладок Tab должен попадать только на
        // активную, между вкладками ходят стрелками.
        tabs[i].setAttribute('tabindex', on ? '0' : '-1');
        if (panel) panel.hidden = !on;
      }
      movePill();
      if (moveFocus) tabs[idx].focus();
    }

    // Ширина вкладок зависит от шрифта и от ширины контейнера (на узком
    // экране вкладки растягиваются на всю строку). Пересчитываем без проезда
    // пилюли через всю ленту — это не переключение, а подгонка.
    var rt;
    function recalc() {
      clearTimeout(rt);
      pill.classList.add('no-anim');
      rt = setTimeout(function () {
        movePill();
        pill.classList.remove('no-anim');
      }, 120);
    }

    // Слушаем оба источника намеренно. ResizeObserver точнее: ловит и те
    // случаи, когда вкладки изменились без ресайза окна. Но его колбэк
    // доставляется в конце кадра, а в панели предпросмотра кадры не идут —
    // там он не срабатывает вообще (та же ловушка, что с rAF в
    // PROJECT_CONTEXT.md). Событие окна проверяемо в обеих средах, поэтому
    // оставлено как страховка. Двойного пересчёта не будет: recalc
    // отложенный, и повторный вызов сбрасывает предыдущий таймер.
    window.addEventListener('resize', recalc);
    if ('ResizeObserver' in window) new ResizeObserver(recalc).observe(box);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

    function bind(tab, i) {
      tab.addEventListener('click', function () { select(i, false); });

      tab.addEventListener('keydown', function (e) {
        var k = e.key;
        var last = tabs.length - 1;
        var next = -1;

        if (k === 'ArrowRight' || k === 'ArrowDown') next = i === last ? 0 : i + 1;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') next = i === 0 ? last : i - 1;
        else if (k === 'Home') next = 0;
        else if (k === 'End') next = last;
        else return;

        e.preventDefault();
        select(next, true);
      });
    }

    for (var i = 0; i < tabs.length; i++) bind(tabs[i], i);

    // Ставим пилюлю под уже активную вкладку из разметки.
    var start = 0;
    for (var n = 0; n < tabs.length; n++) {
      if (tabs[n].getAttribute('aria-selected') === 'true') start = n;
    }
    select(start, false);

    // Анимацию включаем после того, как пилюля встала на место. setTimeout,
    // а не rAF: в фоновой вкладке кадры не идут, и переход остался бы
    // выключенным навсегда.
    setTimeout(function () { pill.classList.remove('no-anim'); }, 80);
  }

  for (var j = 0; j < sws.length; j++) init(sws[j]);
})();
