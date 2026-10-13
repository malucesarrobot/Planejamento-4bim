
(() => {
  'use strict';
  const CFG_KEY = 'malu-sync-cfg', META_KEY = 'malu-sync-meta';
  const DEFAULT_URL = 'https://planejamento-4bim-default-rtdb.firebaseio.com';
  const ROOT = 'planejamento4bim', POLL_MS = 3000;
  const $ = id => document.getElementById(id);
  const view = $('syncView'), btn = $('syncBtn'), urlIn = $('syncUrl'), codeIn = $('syncCode'), statusEl = $('syncStatus');
  let cfg = null, meta = { n: {}, a: {} }, busy = false, pollTimer = null, pushTimer = null, applying = false, lastInput = 0, lastOk = '', lastErr = '', lastFocus = null, inerted = [];
  const pendN = new Set(), pendA = new Set();
  let scopeKey = META_KEY, generation = 0, requested = false, running = null;
  const controllers = new Set();

  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
  const hhmm = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fields = () => [...document.querySelectorAll('textarea[data-save]')];
  const enc = t => t.replace('ª', 'a').replace('º', 'o');
  const dec = c => { const m = /^(\d)([ao])([A-Z])$/.exec(c); return m ? m[1] + (m[2] === 'a' ? 'ª' : 'º') + m[3] : c; };
  const aPath = k => { const i = k.lastIndexOf('|'); return k.slice(0, i) + '/' + enc(k.slice(i + 1)); };
  function flatA(a) { const o = {}; Object.keys(a || {}).forEach(w => Object.keys(a[w] || {}).forEach(tc => { const r = a[w][tc]; if (r && typeof r.t === 'number') o[w + '|' + dec(tc)] = r; })); return o; }
  const base = () => cfg.url.replace(/\/+$/, '') + '/' + ROOT + '/' + cfg.code;
  const saveMeta = () => lsSet(scopeKey, { ...meta, pendingN: [...pendN], pendingA: [...pendA] });
  function selectScope(next) {
    saveMeta(); generation++; requested = false;
    controllers.forEach(ctl => ctl.abort()); clearTimeout(pushTimer);
    const previous = cfg; cfg = next;
    scopeKey = META_KEY + ':' + encodeURIComponent(next.url + '/' + next.code);
    let saved = lsGet(scopeKey);
    if (!saved && previous && previous.url === next.url && previous.code === next.code) saved = lsGet(META_KEY);
    meta = saved && saved.n && saved.a ? saved : { n: {}, a: {} };
    pendN.clear(); pendA.clear();
    (meta.pendingN || []).forEach(id => pendN.add(id)); (meta.pendingA || []).forEach(key => pendA.add(key));
    lastOk = ''; lastErr = ''; saveMeta();
  }

  function setStatus(msg, kind) { if (statusEl) { statusEl.textContent = msg; statusEl.className = 'sync-status' + (kind ? ' ' + kind : ''); } paintBtn(); }
  function paintBtn() { if (!btn) return; btn.textContent = cfg ? (lastErr ? 'Sincronização com erro ⚠' : 'Sincronização ligada' + (lastOk ? ' ✓ ' + lastOk : '')) : 'Sincronizar entre aparelhos (desligado)'; }

  async function http(method, body) {
    const target = base(); const ctl = new AbortController(); controllers.add(ctl); const to = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(target + '.json', { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'o banco recusou o acesso (confira as regras)' : 'erro ' + r.status);
      return await r.json();
    } catch (e) { throw (e && e.name === 'AbortError') ? new Error('sem resposta do banco') : e; }
    finally { clearTimeout(to); controllers.delete(ctl); }
  }
  const canApply = ta => !(document.activeElement === ta && Date.now() - lastInput < 5000);
  function applyNote(ta, v, t) {
    applying = true;
    try { ta.value = v; ta.dispatchEvent(new Event('input', { bubbles: true })); } finally { applying = false; }
    meta.n[ta.dataset.save] = t;
  }

  async function exchange() {
    const epoch = generation;
    setStatus('Sincronizando…');
    try {
      const remote = (await http('GET')) || {};
      if (epoch !== generation || !cfg) return;
      const rn = remote.notes || {}, ra = flatA(remote.aulas);
      const upd = {}, sentN = {}, sentA = {}; let pulled = 0, pushed = 0;
      fields().forEach(ta => {
        const id = ta.dataset.save, r = rn[id]; let lt = meta.n[id] || 0;
        if (pendN.has(id)) {
          lt = Math.max(lt, (r?.t || 0) + 1); meta.n[id] = lt;
          upd['notes/' + id] = { v: ta.value, t: lt }; sentN[id] = lt; pushed++;
        } else if (r && typeof r.t === 'number' && (r.t > lt || r.t === lt && ta.value !== (r.v || ''))) {
          if (canApply(ta)) { applyNote(ta, r.v || '', r.t); pulled++; }
        } else if (r && r.t < lt || !r && (ta.value !== '' || lt)) {
          const t = lt || Date.now(); meta.n[id] = t;
          upd['notes/' + id] = { v: ta.value, t }; sentN[id] = t; pushed++;
        }
      });
      const api = window.__maluAulas, local = api ? api.get() : {}, next = { ...local }; let changed = false;
      new Set([...Object.keys(ra), ...Object.keys(local), ...Object.keys(meta.a)]).forEach(key => {
        const r = ra[key], m = meta.a[key]; let lt = m?.t || 0;
        if (pendA.has(key)) {
          lt = Math.max(lt, (r?.t || 0) + 1); meta.a[key] = { t: lt, del: !local[key] };
          upd['aulas/' + aPath(key)] = { d: local[key] || '', t: lt }; sentA[key] = lt; pushed++;
        } else if (r && (r.t > lt || r.t === lt && (local[key] || '') !== (r.d || ''))) {
          if (r.d) next[key] = r.d; else delete next[key];
          changed = true; pulled++;
        } else if (r && r.t < lt || !r && (local[key] || m)) {
          const t = lt || Date.now(); meta.a[key] = { t, del: !local[key] };
          upd['aulas/' + aPath(key)] = { d: local[key] || '', t }; sentA[key] = t; pushed++;
        }
      });
      if (changed && api) {
        if (api.set(next) === false) throw new Error('não foi possível salvar as aulas recebidas neste aparelho');
        Object.keys(ra).forEach(key => { if (!pendA.has(key) && ra[key].t > (meta.a[key]?.t || 0)) meta.a[key] = { t: ra[key].t, del: !ra[key].d }; });
      }
      // Save the outbound queue before the request; a reload must not lose it.
      Object.keys(sentN).forEach(id => pendN.add(id)); Object.keys(sentA).forEach(key => pendA.add(key)); saveMeta();
      if (Object.keys(upd).length) await http('PATCH', upd);
      if (epoch !== generation || !cfg) return;
      Object.entries(sentN).forEach(([id,t]) => { if (meta.n[id] === t) pendN.delete(id); });
      Object.entries(sentA).forEach(([key,t]) => { if (meta.a[key]?.t === t) pendA.delete(key); });
      saveMeta(); lastOk = hhmm(); lastErr = '';
      setStatus('Sincronizado às ' + lastOk + (pulled || pushed ? ' · recebidos ' + pulled + ', enviados ' + pushed : ''), 'ok');
      if (pendN.size || pendA.size) requested = true;
    } catch (e) {
      if (epoch !== generation || !cfg) return;
      saveMeta(); lastErr = 'Sem sincronizar: ' + (e?.message || 'falha de conexão'); setStatus(lastErr, 'err');
    }
  }
  function syncNow() {
    if (!cfg) return Promise.resolve();
    requested = true;
    if (running) return running;
    busy = true;
    running = (async () => { while (requested && cfg) { requested = false; await exchange(); } })()
      .finally(() => { busy = false; running = null; });
    return running;
  }
  function schedulePush() {
    if (!cfg) return;
    clearTimeout(pushTimer);
    setStatus('Salvo neste aparelho · enviando…');
    pushTimer = setTimeout(syncNow, 250);
  }

  document.addEventListener('input', e => {
    const ta = e.target; if (applying || !ta || !ta.matches || !ta.matches('textarea[data-save]')) return;
    lastInput = Date.now(); const id = ta.dataset.save; meta.n[id] = Math.max(lastInput, (meta.n[id] || 0) + 1); pendN.add(id); saveMeta(); schedulePush();
  }, true);
  document.addEventListener('malu:notes-restored', e => {
    const ids = new Set((e.detail || {}).ids || []), now = Date.now();
    fields().forEach(ta => { if (ids.has(ta.dataset.save)) { meta.n[ta.dataset.save] = Math.max(now, (meta.n[ta.dataset.save] || 0) + 1); pendN.add(ta.dataset.save); } });
    saveMeta(); schedulePush();
  });
  document.addEventListener('malu:aula', e => {
    const d = e.detail || {}; meta.a[d.key] = { t: Math.max(Date.now(), meta.a[d.key] ? meta.a[d.key].t + 1 : 0), del: !d.date }; pendA.add(d.key); saveMeta(); schedulePush();
  });

  function startPolling() {
    clearInterval(pollTimer); pollTimer = setInterval(() => { if (document.visibilityState === 'visible') syncNow(); }, POLL_MS);
  }
  document.addEventListener('visibilitychange', () => { if (cfg && document.visibilityState === 'visible') syncNow(); });
  window.addEventListener('online', () => { if (cfg) syncNow(); });
  window.addEventListener('focus', () => { if (cfg) syncNow(); });
  window.addEventListener('pagehide', saveMeta);

  // ---------- janela de configuração
  function setInert(on) {
    if (on) { inerted = [...document.body.children].filter(n => n !== view && !/^(SCRIPT|STYLE|TEMPLATE)$/.test(n.tagName) && n.id !== 'saveToast' && !n.inert); inerted.forEach(n => { n.inert = true; }); }
    else { inerted.forEach(n => { n.inert = false; }); inerted = []; }
  }
  function openView() {
    const tools = $('navTools'); if (tools) tools.open = false;
    const nt = $('navToggle'); if (nt && nt.getAttribute('aria-expanded') === 'true') nt.click();
    urlIn.value = cfg ? cfg.url : DEFAULT_URL; codeIn.value = cfg ? cfg.code : '';
    if (cfg && lastErr) setStatus(lastErr, 'err'); else setStatus(cfg ? (lastOk ? 'Sincronizado às ' + lastOk : 'Conectado.') : 'Desligado: gere um código e conecte.', cfg && lastOk ? 'ok' : '');
    lastFocus = document.activeElement; setInert(true); view.hidden = false; document.body.classList.add('is-sync'); (cfg ? $('syncNowBtn') : codeIn).focus();
  }
  function closeView() { view.hidden = true; document.body.classList.remove('is-sync'); setInert(false); if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus(); else if (btn) btn.focus(); }
  btn.addEventListener('click', openView);
  $('syncClose').addEventListener('click', closeView);
  view.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeView(); return; }
    if (e.key !== 'Tab') return;
    const f = [...view.querySelectorAll('button, input')].filter(n => n.offsetParent !== null);
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  $('syncGen').addEventListener('click', () => {
    const al = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const a = new Uint8Array(24); crypto.getRandomValues(a);
    codeIn.value = [...a].map(x => al[x % al.length]).join('');
  });
  $('syncCopy').addEventListener('click', async () => {
    const v = codeIn.value.trim(); if (!v) { setStatus('Gere ou digite um código primeiro.', 'err'); return; }
    try { await navigator.clipboard.writeText(v); setStatus('Código copiado.', 'ok'); } catch (e) { codeIn.select(); setStatus('Selecione e copie o código manualmente.', ''); }
  });
  $('syncConnect').addEventListener('click', () => {
    const url = urlIn.value.trim().replace(/\/+$/, ''), code = codeIn.value.trim();
    if (!/^https:\/\/[a-z0-9.-]+\.(firebaseio\.com|firebasedatabase\.app)$/i.test(url)) { setStatus('O endereço do banco deve terminar em firebaseio.com ou firebasedatabase.app.', 'err'); return; }
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(code)) { setStatus('O código precisa ter de 16 a 64 letras, números, _ ou -.', 'err'); return; }
    if (!cfg || cfg.url !== url || cfg.code !== code) selectScope({ url, code });
    lsSet(CFG_KEY, cfg); startPolling(); syncNow();
  });
  $('syncNowBtn').addEventListener('click', () => { if (!cfg) { setStatus('Conecte primeiro.', 'err'); return; } syncNow(); });
  $('syncOff').addEventListener('click', () => {
    saveMeta(); generation++; controllers.forEach(ctl => ctl.abort()); clearTimeout(pushTimer); cfg = null; try { localStorage.removeItem(CFG_KEY); } catch (e) {} clearInterval(pollTimer); lastOk = ''; lastErr = ''; setStatus('Desligado. Suas anotações continuam neste aparelho.', ''); paintBtn();
  });

  cfg = lsGet(CFG_KEY); const m = lsGet(META_KEY); if (m && m.n && m.a) meta = m;
  if (cfg) selectScope(cfg);
  paintBtn();
  if (cfg) { startPolling(); setTimeout(syncNow, 1500); }
  window.MaluSync = { syncNow, config: () => cfg };
})();

