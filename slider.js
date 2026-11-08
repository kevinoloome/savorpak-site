/* Savorpak home page slider. Same-site script, no libraries, no network requests. */
(function () {
  var root = document.querySelector('.hero');
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.sl-dot'));
  var prev = root.querySelector('.sl-prev');
  var next = root.querySelector('.sl-next');
  var toggle = root.querySelector('.sl-pause');
  if (slides.length < 2) return;

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 0;
  var timer = null;
  var userPaused = reduceMotion;

  function show(n) {
    current = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      s.classList.toggle('is-active', i === current);
    });
    dots.forEach(function (d, i) {
      d.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function start() {
    stop();
    if (!userPaused) timer = setInterval(function () { show(current + 1); }, 7000);
  }

  function renderToggle() {
    toggle.textContent = userPaused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
  }

  prev.addEventListener('click', function () { show(current - 1); start(); });
  next.addEventListener('click', function () { show(current + 1); start(); });
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { show(i); start(); });
  });
  toggle.addEventListener('click', function () {
    userPaused = !userPaused;
    renderToggle();
    start();
  });

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);

  renderToggle();
  show(0);
  start();
})();
