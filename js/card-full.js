/* Карточка целиком: раскрывается с шага «Карточка» в сценарии Nearby.

   Своя модалка, а не нативный фулскрин или новая вкладка: карточка должна
   листаться телефоном, а не картинкой в вьюере браузера. Прокрутка живёт
   внутри рамки, страница под подложкой заблокирована — забирать у читателя
   нечего, поэтому здесь это не тот перехват, от которого отказались в
   колесике. */
(function () {
  var box = document.getElementById('cardfull');
  if (!box) return;

  var phone = box.querySelector('.cardfull__phone');
  var opens = document.querySelectorAll('[data-cf-open]');
  if (!opens.length) return;

  var last = null;

  /* Картинка лежит в подложке с visibility:hidden, и ленивая загрузка её не
     начинает — при открытии рамка была бы пустой, пока едут сотни килобайт.
     Грузим заранее, когда читатель только потянулся к кнопке: к клику экран
     уже на месте, а на первую отрисовку страницы вес по-прежнему не влияет. */
  function warm(from) {
    var img = phone && phone.querySelector('img');
    var src = from && from.getAttribute('data-cf-src');
    if (src) { new Image().src = src; return; }
    if (img && img.loading === 'lazy') img.loading = 'eager';
  }

  // Модалка одна на страницу, а раскрывать из неё можно любой экран флоу:
  // что показать, говорит сама кнопка. Без data-cf-src остаётся картинка из
  // разметки — она же работает фолбэком, когда JS не выполнился.
  function show(from) {
    var img = phone && phone.querySelector('img');
    var src = from && from.getAttribute('data-cf-src');
    if (!img || !src) return;
    if (img.getAttribute('src') !== src) {
      img.src = src;
      img.alt = from.getAttribute('data-cf-alt') || '';
      // Размеры подставляем вместе с картинкой, а не снимаем. Без них до
      // конца загрузки у картинки нет пропорции, высота равна нулю, и
      // прокрутка внутри рамки не появляется; с чужими — рамка скакнула бы.
      img.width = from.getAttribute('data-cf-w') || '';
      img.height = from.getAttribute('data-cf-h') || '';
    }
  }

  function open(from) {
    warm(from);
    show(from);
    last = from || null;
    box.classList.add('is-on');
    document.body.classList.add('shade-open');
    // Карточка всегда открывается сверху: читатель только что смотрел на
    // её первый экран в сценарии, и продолжение должно совпасть с ним.
    if (phone) phone.scrollTop = 0;
    var x = box.querySelector('[data-cf-close]');
    if (x) x.focus();
  }

  function close() {
    // Фокус нельзя оставлять внутри подложки: она уезжает в visibility:hidden,
    // но фокус сам оттуда не выходит и следующий Tab начинается из пустоты.
    if (document.activeElement && box.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    box.classList.remove('is-on');
    document.body.classList.remove('shade-open');
    // Фокус возвращаем на кнопку, которой открыли: иначе он падает в начало
    // документа, и клавиатурный читатель теряет место в сценарии.
    if (last) last.focus();
    last = null;
  }

  for (var i = 0; i < opens.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () { open(btn); });
      btn.addEventListener('pointerenter', function () { warm(btn); });
      btn.addEventListener('focus', function () { warm(btn); });
    })(opens[i]);
  }

  box.addEventListener('click', function (e) {
    // Клик мимо рамки закрывает. Внутри телефона — не закрывает: там
    // прокручивают карточку, и случайный клик не должен выбрасывать.
    if (e.target === box || e.target.hasAttribute('data-cf-close')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box.classList.contains('is-on')) close();
  });
})();
