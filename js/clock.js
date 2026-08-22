/* Точное время в контактах. Смещение фиксированное: часы показывают мой час,
   а не час читателя, поэтому берём UTC и прибавляем сдвиг руками — так значение
   не зависит от таймзоны браузера и от базы IANA. */
(function () {
  var el = document.querySelector('[data-clock]');
  if (!el) return;

  var OFFSET = 4; // GMT+4

  function two(n) { return n < 10 ? '0' + n : '' + n; }

  function tick() {
    var now = new Date(Date.now() + OFFSET * 3600 * 1000);
    var h = two(now.getUTCHours());
    var m = two(now.getUTCMinutes());

    el.textContent = h + ':' + m + ' GMT+' + OFFSET;
    el.setAttribute('datetime',
      now.getUTCFullYear() + '-' + two(now.getUTCMonth() + 1) + '-' + two(now.getUTCDate()) +
      'T' + h + ':' + m + '+0' + OFFSET + ':00');

    /* Синхронизируемся с началом следующей минуты, чтобы цифра менялась
       ровно тогда же, когда на часах читателя. */
    setTimeout(tick, 60000 - (Date.now() % 60000));
  }

  tick();
})();
