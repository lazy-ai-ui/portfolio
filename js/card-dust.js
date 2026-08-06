/* Осыпающийся низ карточек «Три вызова». ОТКЛЮЧЁН — эксперимент отложен.

   Чтобы включить обратно, нужны три вещи, которых сейчас в кейсе нет:

   1. Канвас внутри каждой .ch__i, последним элементом карточки. Живой —
      только у «Передачи»:
        <canvas class="ch__dust" aria-hidden="true"></canvas>
        <canvas class="ch__dust" aria-hidden="true" data-dust-live></canvas>

   2. Подключение файла в конце case-nearby.html:
        <script src="js/card-dust.js"></script>

   3. Правка .ch__i в nearby.css: карточка должна обрываться снизу, иначе
      распад упрётся в целую рамку и прочитается как узор внутри карточки, а
      не как её разрушение. Плюс зона под частицы:
        .ch__i { position: relative; padding-bottom: 68px;
                 border-radius: 16px 16px 0 0; border-bottom: 0;
                 box-shadow: inset 0 1px 0 rgba(255,255,255,.7); }
        .ch__dust { position: absolute; left: -1px; right: -1px; bottom: -1px;
                    height: 60px; display: block; pointer-events: none; }
      Внешнюю тень при этом надо снять: она обводит ровный нижний срез и
      выдаёт, что край обрезан, а не осыпался.

   Нерешённое на момент отключения: подложка карточки полупрозрачная, а дырки
   выедаются цветом фона — разница светлоты около 3-4%, и распад может выйти
   почти невидимым. Проверить вживую не удалось.


   Тот же словарь, что у кромки страницы (edge-canvas.js) и у линейки .rule:
   квадрат 5px с шагом 12px. Разница в том, что здесь ничего не дорисовывается
   поверх карточки — наоборот, из её подложки выедаются квадраты цвета фона
   страницы. Поэтому распадается сама карточка, а не узор на ней: снизу она
   обрывается (border-bottom снят, нижние углы выпрямлены), и над срезом
   структура редеет.

   Живёт только карточка с data-dust-live — «Передача», ключевой вызов кейса.
   Две другие получают тот же статичный кадр: форма у тройки общая, движение
   одно. Три источника движения рядом читались бы как рябь.

   Движения по вектору здесь нет намеренно. В edge-canvas клетки отрываются и
   падают — направленное смещение ловится боковым зрением, и три таких блока
   в ряд тянули бы взгляд на себя. Тут дырки только гаснут и зажигаются на
   новом месте, поэтому периферийно эффект читается как тихое дыхание.

   Архитектура общая с остальными канвасами проекта: пул клеток без аллокаций
   в кадре, лерп с независимым от частоты кадров коэффициентом, пауза вне поля
   зрения, статичный кадр для prefers-reduced-motion. */
(function () {
  var cvs = document.querySelectorAll('.ch__dust');
  if (!cvs.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* геометрия .rule: штрих 5px, период 12px */
  var STEP = 12, UNIT = 5;

  /* Доля выеденных клеток по рядам сверху вниз. Верхний ряд почти цел —
     распад начинается незаметно; нижний почти пуст, от него остаются редкие
     квадраты подложки. Числа зеркальны KEEP из edge-canvas: там доля живой
     структуры, здесь доля дырок. */
  var HOLE = [0.08, 0.26, 0.52, 0.78, 0.94];

  /* Как часто одна дырка закрывается, а другая открывается, мс. Крутить
     здесь: меньше — суетливее, больше — мертвее. */
  var PULSE = 1200;

  /* Постоянная времени фейда, с. Дырка гаснет и зажигается за ~3 TAU. */
  var TAU = 0.42;

  /* Цвет страницы: им и выедается подложка, поэтому дырка совпадает с фоном
     за карточкой. Берём из токенов, чтобы не разъехалось при смене темы. */
  var BG = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg').trim() || '#F6F4F1';

  function init(cv) {
    var ctx = cv.getContext('2d');
    var live = cv.hasAttribute('data-dust-live');
    var W = 0, H = 0, dpr = 1, cells = [], holes = 0;

    function build() {
      cells = [];
      holes = 0;
      var n = Math.ceil(W / STEP) + 1;
      var rows = Math.min(HOLE.length, Math.ceil(H / STEP));
      for (var r = 0; r < rows; r++) {
        for (var i = 0; i < n; i++) {
          var open = Math.random() < HOLE[r];
          if (open) holes++;
          cells.push({
            x: i * STEP, y: r * STEP, row: r,
            /* a — текущая непрозрачность дырки, t — та, к которой она идёт.
               Разводим их только на живой карточке; на статичной кадр один. */
            a: open ? 1 : 0, t: open ? 1 : 0
          });
        }
      }
    }

    function size() {
      var r = cv.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        if (c.a < 0.004) continue;
        ctx.globalAlpha = c.a;
        ctx.fillRect(c.x, c.y, UNIT, UNIT);
      }
      ctx.globalAlpha = 1;
    }

    /* Меняем местами одну закрытую и одну открытую клетку в пределах ряда:
       плотность каждого ряда держится сама, пересобирать сетку не нужно.
       Верхний ряд не трогаем — там граница зоны, и мерцание на ней выдало бы
       прямоугольник, которого не должно быть видно. */
    function pulse() {
      if (!cells.length) return;
      var off = null, on = null, i, c;
      for (i = 0; i < 30 && (!off || !on); i++) {
        c = cells[Math.floor(Math.random() * cells.length)];
        if (c.row === 0) continue;
        if (!off && c.t > 0.5) off = c;
        else if (!on && c.t < 0.5 && (!off || c.row === off.row)) on = c;
      }
      if (off) off.t = 0;
      if (on) on.t = 1;
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); draw(); }, 180);
    });

    size();
    draw();

    if (!live || reduce) return;

    var prevTs = null, running = false, rafId = 0, visible = false, pulseT = 0;

    function loop(ts) {
      if (prevTs === null) prevTs = ts;
      var dt = Math.min(0.05, (ts - prevTs) / 1000);
      prevTs = ts;
      /* коэффициент через exp — при просадке кадров скорость фейда та же */
      var k = 1 - Math.exp(-dt / TAU);
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        if (c.a !== c.t) c.a += (c.t - c.a) * k;
      }
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true; prevTs = null;
      pulseT = setInterval(pulse, PULSE);
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
      clearInterval(pulseT);
    }

    function sync() { (visible && !document.hidden) ? start() : stop(); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting; sync();
      }, { threshold: 0 }).observe(cv);
    } else {
      visible = true; sync();
    }
    document.addEventListener('visibilitychange', sync);
  }

  for (var j = 0; j < cvs.length; j++) init(cvs[j]);
})();
