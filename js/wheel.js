/* Колесико: флоу по дуге в кейсе Nearby.

   Прокрутка не перехватывается. Секция высокая, сцена внутри липкая, и
   позиция страницы внутри секции выбирает активный шаг. Эффект тот же, что
   в референсе, но страница не залипает: после последнего шага прокрутка
   идёт дальше сама, а свайп «назад» на iOS продолжает работать.

   На узком экране прокрутка шаг не выбирает вовсе — только кнопки-шевроны.

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
    var arcs = wh.querySelectorAll('.wh__arc');
    if (!screens.length || !stage) return;

    /* Дуг может быть две — сценарий возврата идёт двумя ролями сразу. Тогда
       шаг общий, а экраны у сторон свои: у каждого экрана свой data-i, и на
       шагах, где сторона ничего не делает, её экрана в разметке просто нет.
       Число шагов в таком случае берём из data-steps, а не из числа
       картинок: их больше, чем шагов, и в каждой дуге по-разному. */
    var groups = [];
    for (var g = 0; g < arcs.length; g++) {
      var list = [], els = arcs[g].querySelectorAll('.wh__screen');
      for (var e = 0; e < els.length; e++) {
        list.push({ el: els[e], step: +els[e].getAttribute('data-i') });
      }
      if (list.length) groups.push({ arc: arcs[g], list: list });
    }

    /* Переключатель ролей — только у колесика на две дуги и только на узком
       экране (CSS его там же и показывает). Сегментов ровно два, они равны по
       ширине, поэтому пилюля ездит на 100% и мерить нечего. */
    var roles = wh.querySelector('[data-wh-roles]');
    var roleBtns = roles ? roles.querySelectorAll('[data-wh-role]') : [];
    var cols = wh.querySelectorAll('.wh__col');
    // Ищем по всему колесику, а не внутри переключателя: подпись стоит в
    // нижней строке рядом со счётчиком, сверху она отнимала высоту у макета.
    var st = wh.querySelector('[data-wh-st]');
    var rolePill = roles ? roles.querySelector('.sw__pill') : null;
    var roleTabs = roles ? roles.querySelector('.sw__tabs') : null;
    var roleAt = 0;

    // Пилюля меряется по вкладке — ровно как в switcher.js: вкладки разной
    // ширины, и на ровные 50% рассчитывать нельзя.
    function movePill() {
      if (!rolePill || !roleTabs || !roleBtns.length) return;
      var tab = roleBtns[roleAt];
      if (!tab.offsetWidth) return;   // переключатель скрыт — мерить нечего
      rolePill.style.width = tab.offsetWidth + 'px';
      rolePill.style.transform = 'translateX(' + (tab.offsetLeft - roleTabs.clientLeft) + 'px)';
      rolePill.classList.add('on');
    }

    function setRole(k, byUser) {
      if (!roles) return;
      roleAt = k;
      for (var r = 0; r < roleBtns.length; r++) {
        var on = r === k;
        roleBtns[r].classList.toggle('is-on', on);
        roleBtns[r].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      for (var c = 0; c < cols.length; c++) cols[c].classList.toggle('is-side-on', c === k);
      movePill();
      // Любое действие читателя отменяет автопоказ: он объясняет механику
      // тому, кто её не нашёл, а нашедшему только мешал бы.
      if (byUser) clearTimeout(hintTimer);
    }

    var n = +wh.getAttribute('data-steps') || screens.length;
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
      // Сосед показывается только один с каждой стороны. Двух хватало, чтобы
      // за внимание конкурировали пять макетов сразу: у дальних оставалась
      // читаемая типографика, и глаз не понимал, какой экран активный.
      if (ad > 1) {
        el.style.opacity = '0';
        // z-index сбрасываем обязательно: без этого экран, уехавший далеко,
        // сохранил бы вес от прошлого шага и лёг бы поверх активного.
        el.style.zIndex = '0';
        el.setAttribute('data-off', '');
        el.style.filter = 'blur(6px)';
        el.style.transform = 'translateY(' + (d * 56) + '%) scale(.6)';
        return;
      }
      el.removeAttribute('data-off');
      if (calm) {
        // Без дуги и поворота: остаётся только активный экран.
        el.style.transform = 'none';
        el.style.filter = 'none';
        el.style.opacity = d === 0 ? '1' : '0';
        el.style.zIndex = d === 0 ? '3' : '1';
        if (d !== 0) el.setAttribute('data-off', '');
        return;
      }
      el.style.transform =
        'translateY(' + (d * 56) + '%)' +
        ' translateX(' + (ad * -8) + '%)' +
        ' rotate(' + (d * 7) + 'deg)' +
        ' scale(' + (1 - ad * 0.22) + ')';
      el.style.opacity = ad === 0 ? '1' : '.32';
      // Блюр соседа — не украшение: разнести экраны по вертикали некуда,
      // макет и так во весь рост сцены. Расфокус снимает с соседа
      // читаемость, оставляя его как «что было до» и «что будет после».
      el.style.filter = ad === 0 ? 'none' : 'blur(4px)';
      el.style.zIndex = String(3 - ad);
    }

    function render(i) {
      if (i === cur) return;
      cur = i;
      var waits = '';
      for (var g = 0; g < groups.length; g++) {
        var list = groups[g].list;
        // Активен последний экран, чей шаг уже наступил. Если у стороны на
        // этом шаге экрана нет, held остаётся прежний — и это содержательно:
        // пока владелец снимает и заполняет чеклист, у арендатора на экране
        // не меняется ничего, потому что он ждёт.
        var a = 0;
        for (var k = 0; k < list.length; k++) if (list[k].step <= i) a = k;
        for (k = 0; k < list.length; k++) {
          // is-on нужен узкому экрану: там дуги нет и всё, кроме активного
          // экрана, прячется совсем. На десктопе класс ни на что не влияет.
          list[k].el.classList.toggle('is-on', k === a);
          place(list[k].el, k - a);
        }
        // Сторона, которая на этом шаге не действует, приглушается целиком.
        var idle = list[a].step !== i;
        groups[g].arc.classList.toggle('is-idle', idle);
        // На узком экране приглушать нечего — видна одна сторона. То же самое
        // говорит строка под переключателем: без неё, открыв экран арендатора
        // на шагах приёмки, читатель не узнал бы, что тот ждёт, — а это и есть
        // содержание блока.
        if (idle && roleBtns[g]) waits = roleBtns[g].textContent;
      }
      if (st) st.textContent = waits ? waits + ' ждёт' : '';
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
      // На телефоне прокрутка шаг не выбирает: там листают шевронами, а
      // секция высотой ровно в экран. Проверяем медиазапрос, а не высоту:
      // правило должно совпадать с CSS, а не выводиться из его последствий.
      if (narrow.matches) return;
      // Пока страница едет по кнопке, шаг уже выбран. Без этой блокировки
      // плавная прокрутка сыпала событиями, каждое пересчитывало шаг по
      // промежуточной позиции, и картинку трясло до конца пути.
      if (lockTo !== -1) return;
      var r = wh.getBoundingClientRect();
      var travel = wh.offsetHeight - stage.offsetHeight;
      if (travel <= 0) return;
      /* Зона нечувствительности. Раньше шаг был просто округлением позиции, и
         на границе между шагами хватало нескольких пикселей в обратную
         сторону, чтобы экран отскочил назад: палец на тач-скрине почти
         никогда не идёт строго вниз, и на длинной прокрутке это ловилось
         постоянно. Теперь шаг меняется, только если позиция ушла больше чем
         на полшага, — дрожание руки в этот порог не попадает.

         На последнем шаге это же правило снимает залипание, о котором просил
         Фирдавс: дочитав до конца, читатель прокручивает страницу дальше, и
         случайный ход вверх больше не возвращает его в середину сценария. */
      var f = ((-r.top) / travel) * (n - 1);
      var i = cur;
      if (f > cur + .55 || f < cur - .55) i = Math.round(f);
      if (i < 0) i = 0;
      if (i > n - 1) i = n - 1;
      render(i);
    }

    // Кнопки двигают страницу, а не только картинку: иначе прокрутка и
    // показанный шаг разъезжаются, и следующее движение колёсиком
    // отбрасывало бы читателя назад.
    var lockTo = -1;   // шаг, к которому едем по кнопке; -1 — рулит читатель
    var lockTimer = 0;

    function goTo(i) {
      if (i < 0 || i > n - 1) return;
      // Читатель уже листает сам — подсказывать нечего.
      clearTimeout(hintTimer);
      if (narrow.matches) { render(i); return; }
      var travel = wh.offsetHeight - stage.offsetHeight;
      // Считаем от текущего положения на экране, а не через offsetTop:
      // offsetTop меряется от ближайшего позиционированного предка, и стоит
      // кому-то выше получить position:relative, как расчёт молча поедет.
      var docTop = wh.getBoundingClientRect().top + window.pageYOffset;
      var top = docTop + travel * (i / (n - 1));
      lockTo = i;
      render(i);
      window.scrollTo({ top: top, behavior: calm ? 'auto' : 'smooth' });
      // Предохранитель: если прокрутка никуда не поедет (шаг уже на месте),
      // событий не будет и блокировку снимать некому.
      clearTimeout(lockTimer);
      lockTimer = setTimeout(unlock, 700);
    }

    function unlock() {
      lockTo = -1;
      fromScroll();
    }

    // Блокировку снимаем по тишине, а не по таймеру фиксированной длины:
    // сколько едет плавная прокрутка, решает браузер и длина пути.
    function onScroll() {
      if (lockTo !== -1) {
        clearTimeout(lockTimer);
        lockTimer = setTimeout(unlock, 140);
        return;
      }
      fromScroll();
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

    /* Автопоказ переключателя. Сегментированный контрол над экраном легко
       принять за подпись, поэтому один раз он показывает себя сам: читатель
       видит арендатора, через 5 секунд пилюля переезжает на владельца — и
       становится понятно, что у шага две стороны.

       Один раз за визит и только когда блок реально перед глазами: сработать
       в невидимой части страницы значит потратить единственный показ впустую.
       Щадящий режим механику не отменяет — она объясняет содержание, — но
       переезд там мгновенный, за это отвечает CSS. */
    var hintTimer = 0;
    var HINT_KEY = 'nearby-roles-hint';

    function armHint() {
      if (!roles || !narrow.matches) return;
      try { if (sessionStorage.getItem(HINT_KEY)) return; } catch (err) {}
      if (!('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (entries) {
        for (var e = 0; e < entries.length; e++) {
          if (!entries[e].isIntersecting) continue;
          io.disconnect();
          try { sessionStorage.setItem(HINT_KEY, '1'); } catch (err) {}
          hintTimer = setTimeout(function () { setRole(1); }, 5000);
        }
      }, { threshold: .6 });
      io.observe(stage);
    }

    for (var r = 0; r < roleBtns.length; r++) {
      (function (btn, k) {
        btn.addEventListener('click', function () { setRole(k, true); });
      })(roleBtns[r], r);
    }

    // passive: обработчик ничего не отменяет, и браузер не ждёт его,
    // чтобы начать прокрутку.
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { fromScroll(); movePill(); });

    render(0);
    fromScroll();
    setRole(0);
    // Первая установка пилюли — без проезда через всю ленту, как в switcher.js.
    if (rolePill) setTimeout(function () { rolePill.classList.remove('no-anim'); }, 80);
    armHint();

    // Наружу для проверки: в панели предпросмотра прокрутка не применяется,
    // и без этого шаги не потрогать.
    wh.whGoTo = goTo;
    wh.whRender = render;
  }

  for (var i = 0; i < whs.length; i++) init(whs[i]);
})();
