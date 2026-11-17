/* Brightfold chat: a small scripted helper in the bottom-right corner. Answers basic questions from the site's own facts
   (hours, address, prices, booking, phone, services), in RO or RU, and hands anything else to WhatsApp.
   Config: window.BF_CHAT = { name, role:{ro,ru}, phone, hello:{ro,ru}, topics:[{k:[keywords], ro, ru, chip:{ro,ru}, generic:true for price/hours/booking/contact topics}], wa:{ro,ru} }
   Styling comes from the page's own tokens through --chat-* custom properties set on :root (--chat-bottom / --chat-bottom-m lift it above a page's own fixed bar). */
(() => {
  const C = window.BF_CHAT; if (!C) return;
  const L = () => (document.documentElement.lang === 'ru' ? 'ru' : 'ro');
  const t = (o, l = L()) => (o ? o[l] || o.ro : '');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N} ]/gu, ' ');
  const css = `
  .bfc-btn{position:fixed;right:20px;bottom:var(--chat-bottom,20px);z-index:150;width:60px;height:60px;border-radius:var(--chat-radius,50%);border:0;cursor:pointer;background:var(--chat-bg);color:var(--chat-ink);display:grid;place-items:center;box-shadow:0 10px 30px var(--chat-shadow,rgba(0,0,0,.25));transition:transform .22s cubic-bezier(.2,.7,.2,1)}
  .bfc-btn:hover{transform:translateY(-2px)} .bfc-btn:focus-visible{outline:3px solid var(--chat-focus,var(--chat-bg));outline-offset:3px}
  .bfc-btn svg{width:26px;height:26px} .bfc-btn .bfc-x{display:none} .bfc-open .bfc-btn .bfc-x{display:block} .bfc-open .bfc-btn .bfc-c{display:none}
  .bfc-panel{margin:0;padding:0;position:fixed;right:20px;bottom:calc(var(--chat-bottom,20px) + 72px);z-index:150;width:min(370px,calc(100vw - 24px));height:min(540px,calc(100dvh - 130px));display:flex;flex-direction:column;background:var(--chat-paper);color:var(--chat-text);border-radius:var(--chat-panel-radius,18px);box-shadow:0 24px 60px var(--chat-shadow,rgba(0,0,0,.28));overflow:hidden;opacity:0;transform:translateY(12px) scale(.98);transform-origin:bottom right;pointer-events:none;transition:opacity .22s ease-out,transform .22s cubic-bezier(.2,.7,.2,1);font-family:var(--chat-font,inherit)}
  .bfc-open .bfc-panel{opacity:1;transform:none;pointer-events:auto}
  .bfc-head{display:flex;align-items:center;gap:12px;padding:16px 18px;background:var(--chat-bg);color:var(--chat-ink)}
  .bfc-av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--chat-ink);color:var(--chat-bg);font:700 18px/1 var(--chat-display,inherit);flex:none}
  .bfc-head b{display:block;font:600 17px/1.2 var(--chat-display,inherit)} .bfc-head small{font-size:13px;opacity:.85}
  .bfc-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}
  .bfc-m{max-width:86%;padding:10px 14px;border-radius:16px;font-size:15px;line-height:1.45;white-space:pre-line}
  .bfc-m.bot{align-self:flex-start;background:var(--chat-bubble);color:var(--chat-text);border-bottom-left-radius:4px}
  .bfc-m.me{align-self:flex-end;background:var(--chat-bg);color:var(--chat-ink);border-bottom-right-radius:4px}
  .bfc-m a{color:inherit;font-weight:700}
  .bfc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px}
  .bfc-chips button{min-height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--chat-line);background:transparent;color:var(--chat-text);font:500 14px/1 inherit;cursor:pointer}
  .bfc-chips button:hover{border-color:var(--chat-bg)} .bfc-chips button:focus-visible,.bfc-form input:focus-visible,.bfc-form button:focus-visible{outline:2px solid var(--chat-bg);outline-offset:2px}
  .bfc-form{display:flex;gap:8px;padding:12px;border-top:1px solid var(--chat-line)}
  .bfc-form input{flex:1;min-width:0;min-height:44px;border:1px solid var(--chat-field,var(--chat-line));border-radius:12px;padding:0 12px;background:var(--chat-paper);color:var(--chat-text);font:400 16px/1 inherit}
  .bfc-form button{min-width:44px;min-height:44px;border:0;border-radius:12px;background:var(--chat-bg);color:var(--chat-ink);cursor:pointer;display:grid;place-items:center}
  .bfc-form button svg{width:20px;height:20px}
  .bfc-note{padding:0 16px 10px;font-size:12px;opacity:.7}
  @media (max-width:900px){.bfc-btn{bottom:var(--chat-bottom-m,84px);right:14px;width:54px;height:54px}.bfc-panel{right:12px;bottom:calc(var(--chat-bottom-m,84px) + 64px);height:min(520px,calc(100dvh - 170px))}}
  @media (prefers-reduced-motion:reduce){.bfc-panel,.bfc-btn{transition:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const root = document.createElement('div'); root.className = 'bfc';
  root.innerHTML = `<button class="bfc-btn" type="button" aria-expanded="false" aria-controls="bfc-panel"><svg class="bfc-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/></svg><svg class="bfc-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <div class="bfc-panel" id="bfc-panel" role="dialog" aria-label="${C.name}"><div class="bfc-head"><span class="bfc-av" aria-hidden="true">${C.name[0]}</span><div><b>${C.name}</b><small class="bfc-role"></small></div></div>
  <div class="bfc-log" role="log" aria-live="polite"></div><div class="bfc-chips"></div><p class="bfc-note"></p>
  <form class="bfc-form"><label class="bfc-sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)" for="bfc-in">Mesaj</label><input id="bfc-in" name="q" autocomplete="off"><button type="submit" aria-label="Trimite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button></form></div>`;
  document.body.appendChild(root);
  const btn = root.querySelector('.bfc-btn'), log = root.querySelector('.bfc-log'), chips = root.querySelector('.bfc-chips'), form = root.querySelector('.bfc-form'), input = form.q;
  btn.setAttribute('aria-label', t({ ro: `Deschide chatul cu ${C.name}`, ru: `Открыть чат с ${C.name}` }));
  const add = (html, who = 'bot') => { const m = document.createElement('div'); m.className = 'bfc-m ' + who; m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; };
  const wa = () => `<a href="https://wa.me/${C.phone}" target="_blank" rel="noopener">WhatsApp</a>`;
  const answer = (q) => {
    const n = ' ' + norm(q) + ' ';
    let best = null, score = 0;
    /* a topic about a named service beats a generic one (price, hours) when both match: 'how much is M22' answers M22 */
    C.topics.forEach((tp) => { let s = tp.k.reduce((a, k) => { const w = norm(k).trim(); return a + (n.includes(w.length <= 3 ? ` ${w} ` : ' ' + w) ? k.length : 0); }, 0); if (s && !tp.generic) s += 100; if (s > score) { score = s; best = tp; } });
    /* keywords match at the start of a word, and short ones (3 letters) only as whole words, so 'par' (hair) does not fire on 'parcare'; the reply follows the script the visitor typed in */
    const ql = /[\u0400-\u04FF]/.test(q) ? 'ru' : /[a-z]/i.test(q) ? 'ro' : L();
    if (best) return t(best, ql).replace('{wa}', wa());
    if (/^\s*(buna|salut|hello|hi|привет|здравств|добрый)/.test(norm(q))) return t(C.hello, ql);
    return t(C.wa || { ro: `Nu sunt sigură că știu asta. Echipa vă răspunde imediat pe {wa}.`, ru: `Не уверена, что знаю ответ. Команда ответит в {wa}.` }, ql).replace('{wa}', wa());
  };
  const paintChips = () => { chips.innerHTML = C.topics.filter((x) => x.chip).slice(0, 5).map((x, i) => `<button type="button" data-i="${C.topics.indexOf(x)}">${t(x.chip)}</button>`).join(''); };
  const paint = () => { root.querySelector('.bfc-role').textContent = t(C.role); input.placeholder = t({ ro: 'Scrie o întrebare…', ru: 'Напишите вопрос…' }); root.querySelector('.bfc-note').textContent = t({ ro: 'Asistent automat al site-ului. Pentru detalii, echipa e pe WhatsApp.', ru: 'Автоматический помощник сайта. Подробности у команды в WhatsApp.' }); paintChips(); };
  let greeted = false;
  const open = (v) => { root.classList.toggle('bfc-open', v); btn.setAttribute('aria-expanded', String(v)); btn.setAttribute('aria-label', v ? t({ ro: 'Închide chatul', ru: 'Закрыть чат' }) : t({ ro: `Deschide chatul cu ${C.name}`, ru: `Открыть чат с ${C.name}` })); if (v) { paint(); if (!greeted) { greeted = true; add(t(C.hello)); } setTimeout(() => input.focus({ preventScroll: true }), 60); } };
  btn.addEventListener('click', () => open(!root.classList.contains('bfc-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('bfc-open')) { open(false); btn.focus(); } });
  chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const tp = C.topics[+b.dataset.i]; add(b.textContent, 'me'); setTimeout(() => add(t(tp).replace('{wa}', wa())), 260); });
  form.addEventListener('submit', (e) => { e.preventDefault(); const q = input.value.trim(); if (!q) return; add(q.replace(/</g, '&lt;'), 'me'); input.value = ''; setTimeout(() => add(answer(q)), 320); });
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.BFChat = { open: () => open(true), ask: (q) => answer(q) };
})();
