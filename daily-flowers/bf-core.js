/* Brightfold core: language, chips, pickers, WhatsApp forms, reveals, WebGL guard, intro gate. Shared plumbing only; each site's look and 3D are its own. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  const key = (document.documentElement.dataset.key || 'bf') + '-lang';
  const hooks = [];
  const BF = { $, $$, reduce, store, lang: 'ro' };
  BF.T = (ro, ru) => (BF.lang === 'ru' ? ru : ro);
  BF.onLang = (fn) => { hooks.push(fn); fn(BF.lang); };
  BF.ro = (el) => (el ? el.dataset.ro || el.textContent.trim() : '');
  BF.val = (g) => $(`[data-g="${g}"] .chip[aria-pressed="true"]`);
  BF.multi = (sel) => $$(`${sel} .chip[aria-pressed="true"]`).map(BF.ro);

  /* day chips: next n days, skipping weekdays in `closed` (0 = Sunday) */
  BF.days = (el, { n = 8, closed = [], from = 0 } = {}) => {
    const dRo = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'], dRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    let k = 0;
    for (let i = from; k < n && i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() + i); if (closed.includes(d.getDay())) continue;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip day'; b.setAttribute('aria-pressed', String(k === 0));
      b.dataset.date = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      b.dataset.dro = i === 0 ? 'Azi' : i === 1 ? 'Mâine' : dRo[d.getDay()]; b.dataset.dru = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : dRu[d.getDay()];
      b.innerHTML = `<span>${b.dataset.dro}</span><small>${b.dataset.date}</small>`; el.appendChild(b); k++;
    }
  };
  BF.dayText = (b) => (b ? `${b.dataset.dro} ${b.dataset.date}` : '');
  BF.times = (el, { from = 10, to = 19, step = 30, def } = {}) => {
    for (let m = from * 60; m <= to * 60; m += step) { const t = `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t; b.setAttribute('aria-pressed', String(t === (def || `${from + 1}:00`))); el.appendChild(b); }
  };

  /* WhatsApp form: validates name + phone (+ extra required fields), builds the message, opens wa.me */
  BF.form = (sel, { phone, need = [], msg }) => {
    const f = $(sel); if (!f) return; const err = $('.err', f);
    f.addEventListener('submit', (e) => {
      e.preventDefault(); if (err) err.textContent = '';
      const req = ['name', 'phone', ...need];
      const bad = req.filter((k) => f[k] && (!f[k].value.trim() || (k === 'phone' && f.phone.value.replace(/\D/g, '').length < 8)));
      $$('input,textarea', f).forEach((i) => i.removeAttribute('aria-invalid')); bad.forEach((k) => f[k].setAttribute('aria-invalid', 'true'));
      if (bad.length) { if (err) err.textContent = BF.T('Completează câmpurile marcate: nume și un telefon valid.', 'Заполните отмеченные поля: имя и корректный телефон.'); f[bad[0]].focus(); return; }
      const text = msg(f) + `\nNume: ${f.name.value.trim()}\nTelefon: ${f.phone.value.trim()}`;
      window.open(`https://wa.me/${phone}?text=` + encodeURIComponent(text), '_blank', 'noopener');
    });
  };

  /* WebGL guard: returns a renderer or null and marks the page .no-gl */
  BF.gl = (canvas, opt = {}) => {
    let ok = false; try { ok = !!(canvas.getContext('webgl2') || canvas.getContext('webgl')); } catch {}
    if (!window.THREE || !ok) { document.documentElement.classList.add('no-gl'); return null; }
    const r = new THREE.WebGLRenderer(Object.assign({ canvas, antialias: true, alpha: true }, opt));
    r.setPixelRatio(Math.min(devicePixelRatio, opt.dpr || 1.75)); r.outputEncoding = THREE.sRGBEncoding; return r;
  };
  /* run fn(t) every frame only while el is on screen */
  BF.loop = (el, fn) => {
    let vis = false, raf = 0; const t0 = performance.now();
    const tick = () => { if (!vis || !el.isConnected) { raf = 0; return; } raf = requestAnimationFrame(tick); fn((performance.now() - t0) / 1000); };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) tick(); }).observe(el);
  };
  BF.fit = (renderer, cam, canvas, after) => { const s = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; if (after) after(w, h); cam.updateProjectionMatrix(); }; s(); addEventListener('resize', s); };

  /* intro gate: #gate overlay; BF.gate(play) where play(done) runs the site's own 3D transition and calls done() */
  BF.gate = (play) => {
    const g = $('#gate'); if (!g) return;
    document.documentElement.classList.add('gated');
    const finish = () => { g.remove(); document.documentElement.classList.remove('gated'); window.scrollTo(0, 0); dispatchEvent(new Event('bf:enter')); };
    const go = () => { $$('#gate button').forEach((b) => (b.disabled = true)); if (reduce) return finish(); g.classList.add('going'); play(finish); };
    $$('[data-enter]', g).forEach((b) => b.addEventListener('click', go));
    $$('[data-skip]', g).forEach((b) => b.addEventListener('click', finish));
    addEventListener('keydown', function k(e) { if (e.key === 'Escape' && document.contains(g)) { removeEventListener('keydown', k); finish(); } });
  };

  /* chips: single choice per .chips[data-g], toggles for .chips[data-multi] */
  document.addEventListener('click', (e) => {
    const c = e.target.closest('.chips .chip'); if (!c) return; const g = c.closest('.chips');
    if (g.dataset.multi) { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); return; }
    $$('.chip', g).forEach((x) => x.setAttribute('aria-pressed', String(x === c))); g.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* language: [data-ru] swaps text; .lang button[data-lang]; day chips relabel */
  BF.setLang = (l) => {
    BF.lang = l; document.documentElement.lang = l;
    $$('[data-ru]').forEach((el) => { if (el.dataset.ro === undefined) el.dataset.ro = el.textContent; el.textContent = l === 'ru' ? el.dataset.ru : el.dataset.ro; });
    $$('[data-ru-ph]').forEach((el) => { if (el.dataset.roPh === undefined) el.dataset.roPh = el.placeholder; el.placeholder = l === 'ru' ? el.dataset.ruPh : el.dataset.roPh; });
    $$('.chip.day span').forEach((s) => { s.textContent = l === 'ru' ? s.parentNode.dataset.dru : s.parentNode.dataset.dro; });
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    store.set(key, l); hooks.forEach((fn) => fn(l));
  };
  BF.init = () => {
    $$('[data-ru]').forEach((el) => { el.dataset.ro = el.textContent; });
    $$('.lang button').forEach((b) => b.addEventListener('click', () => BF.setLang(b.dataset.lang)));
    if (store.get(key) === 'ru') BF.setLang('ru');
    const nav = $('#nav'); if (nav) { const at = +nav.dataset.solid || 30; const on = () => nav.classList.toggle('solid', scrollY > at); addEventListener('scroll', on, { passive: true }); on(); }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach((el) => io.observe(el));
  };
  window.BF = BF;
})();
