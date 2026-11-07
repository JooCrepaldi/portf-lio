// Theme toggle: explicit choice wins over the system preference.
const root = document.documentElement;
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

document.querySelectorAll('.theme-toggle').forEach(btn => {
  const label = () => btn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
  label();
  btn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });
});

// Videos marked data-autoplay play only while on screen.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const autoVideos = document.querySelectorAll('video[data-autoplay]');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  }, { threshold: 0.25 });
  autoVideos.forEach(v => io.observe(v));
}

// Table of contents: highlight the section being read.
const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
if (tocLinks.length) {
  const byId = new Map(tocLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const targets = [...byId.keys()].map(id => document.getElementById(id)).filter(Boolean);
  let activeId = null;
  const setActive = id => {
    if (id === activeId) return;
    activeId = id;
    tocLinks.forEach(a => a.classList.toggle('active', a === byId.get(id)));
    const link = byId.get(id);
    const bar = link && link.closest('ol');
    if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: link.offsetLeft - 16, behavior: 'smooth' });
  };
  const onScroll = () => {
    let current = targets[0];
    for (const t of targets) if (t.getBoundingClientRect().top < innerHeight * 0.35) current = t;
    if (current) setActive(current.id);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Before / after slider. Em modo steps, o arraste troca entre as versões.
document.querySelectorAll('.compare').forEach(cmp => {
  cmp.querySelector('input').addEventListener('input', e => {
    if (cmp.classList.contains('steps')) {
      const v = +e.target.value;
      cmp.querySelectorAll('[data-step],[data-i]').forEach(el => el.classList.toggle('on', +el.dataset.step === v || +el.dataset.i === v));
    } else {
      cmp.style.setProperty('--pos', e.target.value + '%');
    }
  });
});

// Carousel: botões avançam/atrasam um post por clique.
document.querySelectorAll('.carousel').forEach(c => {
  const track = c.querySelector('.track');
  const step = () => track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 10);
  c.querySelector('.prev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  c.querySelector('.next').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
});
