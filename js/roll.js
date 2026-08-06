/* Флоу в карточке Nearby на главной.

   Вместо видео — те же экспорты, что в кейсе, только мельче. Видеофайл здесь
   проигрывал бы по всем статьям: текст на экранах пережимается, вес втрое
   больше, а автоплей на мобильных браузерах требует muted+playsinline и всё
   равно иногда не стартует. Здесь стартовать нечему — это разметка.

   Проход один. На главной уже два канваса с собственным движением (хиро и
   заглушка третьего проекта), и бесконечная карусель третьим фоном спорила бы
   с ними за внимание. Поэтому: показались — прошли сценарий один раз —
   остановились на последнем экране. Повтор по наведению, то есть по прямому
   действию читателя. */
(function () {
  var roll = document.querySelector('[data-roll]');
  if (!roll) return;

  var screens = roll.querySelectorAll('.roll__s');
  if (!screens.length) return;

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var n = screens.length;
  var cur = -1;
  var timer = 0;
  var STEP = 1700;

  function place(el, d) {
    var ad = d < 0 ? -d : d;
    if (ad > 1) {
      // Дальние экраны не просто прозрачны, а уведены за край: иначе при
      // возврате к первому шагу они проступали бы из центра.
      el.style.transform = 'translateX(' + (d * 96) + '%) scale(.66)';
      el.style.opacity = '0';
      el.style.filter = 'blur(3px)';
      el.style.zIndex = '0';
      return;
    }
    el.style.transform = 'translateX(' + (d * 88) + '%) scale(' + (1 - ad * .18) + ')';
    el.style.opacity = ad === 0 ? '1' : '.42';
    el.style.filter = ad === 0 ? 'none' : 'blur(2px)';
    el.style.zIndex = String(3 - ad);
  }

  function render(i) {
    if (i === cur) return;
    cur = i;
    for (var k = 0; k < n; k++) place(screens[k], k - i);
  }

  function stop() {
    clearTimeout(timer);
    timer = 0;
  }

  function play() {
    stop();
    if (cur >= n - 1) return;
    timer = setTimeout(function () {
      render(cur + 1);
      play();
    }, STEP);
  }

  function replay() {
    stop();
    render(0);
    play();
  }

  render(0);

  if (calm) return;   // композиция собрана, дальше — только по желанию читателя

  /* Ждём появления в вьюпорте: единственный проход, начавшийся за пределами
     экрана, читатель бы просто не увидел, а повторить его нечем — карусели
     здесь нет. */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        if (!entries[e].isIntersecting) continue;
        io.disconnect();
        play();
      }
    }, { threshold: .5 });
    io.observe(roll);
  } else {
    play();
  }

  // Повтор по прямому действию. Наведение на всю медиа-часть, а не на сам
  // ролик: курсор идёт к карточке, чтобы кликнуть, и промахнуться мимо
  // телефона в центре легко.
  var media = roll.closest('.project__media') || roll;
  media.addEventListener('pointerenter', function () {
    if (!timer) replay();
  });
  media.addEventListener('focus', function () {
    if (!timer) replay();
  });
})();
