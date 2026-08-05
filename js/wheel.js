/* Колесико: флоу по дуге в кейсе Nearby.

   Прокрутка не перехватывается. Секция высокая, сцена внутри липкая, и
   позиция страницы внутри секции выбирает активный шаг. Эффект тот же, что
   в референсе, но страница не залипает: после последнего шага прокрутка
   идёт дальше сама, а свайп «назад» на iOS продолжает работать.

   Без JS список экранов остаётся обычной колонкой картинок — класс wh--on,
   который включает выкладку по дуге, вешается отсюда. */
(function () {
  var whs = document.querySelectorAll('.wh');
  if (!whs.length) return;

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(wh) {
    var screens = wh.querySelectorAll('.wh__screen');
    var texts = wh.querySelectorAll('.wh__text');
    var now = wh.querySelector('[data-wh-now]');
    var btns = wh.querySelectorAll('[data-wh-dir]');
    var stage = wh.querySelector('.wh__stage');
    if (!screens.length || !stage) return;

    var n = screens.length;
    var cur = -1;
    wh.style.setProperty('--steps', n);
    wh.classList.add('wh--on');

    // Узкий экран ведёт себя иначе: дуги нет, соседние экраны скрыты.
    // Проверяем через ту же границу, что в CSS, чтобы поведение не разъезжалось.
    var narrow = window.matchMedia('(max-width: 900px)');

    function place(el, d) {
      // d — расстояние до активного шага. Соседи уходят вниз и вверх по дуге,
      // отклоняются от вертикали и отступают вглубь.
      var ad = d < 0 ? -d : d;
      if (ad > 2) {
        el.style.opacity = '0';
        // z-index сбрасываем обязательно: без этого экран, уехавший далеко,
        // сохранил бы вес от прошлого шага и лёг бы поверх активного.
        el.style.zIndex = '0';
        el.setAttribute('data-off', '');
        el.style.transform = 'translateY(' + (d * 46) + '%) scale(.6)';
        return;
      }
      el.removeAttribute('data-off');
      if (calm) {
        // Без дуги и поворота: остаётся только активный экран.
        el.style.transform = 'none';
        el.style.opacity = d === 0 ? '1' : '0';
        el.style.zIndex = d === 0 ? '3' : '1';
        if (d !== 0) el.setAttribute('data-off', '');
        return;
      }
      el.style.transform =
        'translateY(' + (d * 46) + '%)' +
        ' translateX(' + (ad * -7) + '%)' +
        ' rotate(' + (d * 7) + 'deg)' +
        ' scale(' + (1 - ad * 0.16) + ')';
      el.style.opacity = ad === 0 ? '1' : (ad === 1 ? '.5' : '.2');
      el.style.zIndex = String(3 - ad);
    }

    function render(i) {
      if (i === cur) return;
      cur = i;
      for (var s = 0; s < screens.length; s++) {
        // is-on нужен узкому экрану: там дуги нет и всё, кроме активного
        // экрана, прячется совсем. На десктопе класс ни на что не влияет.
        screens[s].classList.toggle('is-on', s === i);
        place(screens[s], s - i);
      }
      for (var t = 0; t < texts.length; t++) {
        texts[t].classList.toggle('is-on', t === i);
      }
      if (now) now.textContent = String(i + 1);
      for (var b = 0; b < btns.length; b++) {
        var dir = +btns[b].getAttribute('data-wh-dir');
        btns[b].disabled = dir < 0 ? i === 0 : i === n - 1;
      }
    }

    // Позиция прокрутки → номер шага. Считаем от секции, а не от окна:
    // навбар и высота сцены на расчёт не влияют.
    function fromScroll() {
      var r = wh.getBoundingClientRect();
      var travel = wh.offsetHeight - stage.offsetHeight;
      if (travel <= 0) return;
      var p = (-r.top) / travel;
      var i = Math.round(p * (n - 1));
      if (i < 0) i = 0;
      if (i > n - 1) i = n - 1;
      render(i);
    }

    // Кнопки двигают страницу, а не только картинку: иначе прокрутка и
    // показанный шаг разъезжаются, и следующее движение колёсиком
    // отбрасывало бы читателя назад.
    function goTo(i) {
      if (i < 0 || i > n - 1) return;
      if (narrow.matches) { render(i); return; }
      var travel = wh.offsetHeight - stage.offsetHeight;
      // Считаем от текущего положения на экране, а не через offsetTop:
      // offsetTop меряется от ближайшего позиционированного предка, и стоит
      // кому-то выше получить position:relative, как расчёт молча поедет.
      var docTop = wh.getBoundingClientRect().top + window.pageYOffset;
      var top = docTop + travel * (i / (n - 1));
      window.scrollTo({ top: top, behavior: calm ? 'auto' : 'smooth' });
      render(i);
    }

    for (var b = 0; b < btns.length; b++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          goTo(cur + (+btn.getAttribute('data-wh-dir')));
        });
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(cur + 1); }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(cur - 1); }
        });
      })(btns[b]);
    }

    // passive: обработчик ничего не отменяет, и браузер не ждёт его,
    // чтобы начать прокрутку.
    window.addEventListener('scroll', fromScroll, { passive: true });
    window.addEventListener('resize', fromScroll);

    render(0);
    fromScroll();

    // Наружу для проверки: в панели предпросмотра прокрутка не применяется,
    // и без этого шаги не потрогать.
    wh.whGoTo = goTo;
    wh.whRender = render;
  }

  for (var i = 0; i < whs.length; i++) init(whs[i]);
})();
