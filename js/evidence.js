/* Связка «карточка случая → метка на шкале» в кейсе Nearby.
   Ничего не показывает и не прячет: цитаты видны всегда. Единственная
   задача — при наведении на карточку подсветить её метку на шкале, чтобы
   читатель увидел, к какому моменту сделки относится случай. */
(function () {
  var root = document.getElementById('ev-problem');
  if (!root) return;

  // Ховер — единственный вход, поэтому на тач-устройствах модуль не нужен:
  // там подсветка залипала бы после тапа и ничего не объясняла.
  if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;

  var cards = root.querySelectorAll('.ev__c');
  // Метки живут в шкале выше, поэтому ищем их не внутри root.
  var marks = document.querySelectorAll('.tl__mark');
  if (!marks.length) return;

  function light(id) {
    for (var i = 0; i < marks.length; i++) {
      marks[i].classList.toggle('is-on', marks[i].getAttribute('data-ev') === id);
    }
  }

  function bind(card) {
    var id = card.getAttribute('data-ev');
    card.addEventListener('mouseenter', function () { light(id); });
  }

  for (var i = 0; i < cards.length; i++) bind(cards[i]);

  // Гасим, только когда курсор ушёл со всего ряда: перебор карточек не
  // должен мигать шкалой на промежутках между ними.
  root.addEventListener('mouseleave', function () { light(''); });
})();
