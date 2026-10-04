
(() => {
  'use strict';
  const CFG_KEY = 'malu-sync-cfg', META_KEY = 'malu-sync-meta';
  const DEFAULT_URL = 'https://planejamento-4bim-default-rtdb.firebaseio.com';
  const ROOT = 'planejamento4bim', POLL_MS = 30000;
  const $ = id => document.getElementById(id);
  const view = $('syncView'), btn = $('syncBtn'), urlIn = $('syncUrl'), codeIn = $('syncCode'), statusEl = $('syncStatus');
  let cfg = null, meta = { n: {}, a: {} }, busy = false, pollTimer = null, pushTimer = null, applying = false, lastInput = 0, lastOk = '', lastErr = '', lastFocus = null, inerted = [];
  const pendN = new Set(), pendA = new Set();

  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
  const hhmm = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fields = () => [...document.querySelectorAll('textarea[data-save]')];
  const enc = t => t.replace('ª', 'a').replace('º', 'o');
  const dec = c => { const m = /^(\d)([ao])([A-Z])$/.exec(c); return m ? m[1] + (m[2] === 'a' ? 'ª' : 'º') + m[3] : c; };
  const aPath = k => { const i = k.lastIndexOf('|'); return k.slice(0, i) + '/' + enc(k.slice(i + 1)); };
  function flatA(a) { const o = {}; Object.keys(a || {}).forEach(w => Object.keys(a[w] || {}).forEach(tc => { const r = a[w][tc]; if (r && typeof r.t === 'number') o[w + '|' + dec(tc)] = r; })); return o; }
  const base = () => cfg.url.replace(/\/+$/, '') + '/' + ROOT + '/' + cfg.code;
  const saveMeta = () => lsSet(META_KEY, meta);

  function setStatus(msg, kind) { if (statusEl) { statusEl.textContent = msg; statusEl.className = 'sync-status' + (kind ? ' ' + kind : ''); } paintBtn(); }
  function paintBtn() { if (!btn) return; btn.textContent = cfg ? (lastErr ? 'Sincronização com erro ⚠' : 'Sincronização ligada' + (lastOk ? ' ✓ ' + lastOk : '')) : 'Sincronizar entre aparelhos (desligado)'; }

  async function http(method, body) {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(base() + '.json', { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'o banco recusou o acesso (confira as regras)' : 'erro ' + r.status);
      return await r.json();
    } catch (e) { throw (e && e.name === 'AbortError') ? new Error('sem resposta do banco') : e; }
    finally { clearTimeout(to); }
  }
  const canApply = ta => !(document.activeElement === ta && Date.now() - lastInput < 5000);
  function applyNote(ta, v, t) {
    applying = true;
    try { ta.value = v; ta.dispatchEvent(new Event('input', { bubbles: true })); } finally { applying = false; }
    meta.n[ta.dataset.save] = t;
  }

  async function syncNow() {
    if (!cfg || busy) return;
    busy = true; setStatus('Sincronizando…');
    try {
      const snapshotN = Object.fromEntries(Object.entries(meta.n)), snapshotA = Object.fromEntries(Object.entries(meta.a).map(([k,v]) => [k,v.t]));
      const remote = (await http('GET')) || {};
      const rn = remote.notes || {}, ra = flatA(remote.aulas);
      const upd = {}; let pulled = 0, pushed = 0; const now = Date.now();
      fields().forEach(ta => {
        const id = ta.dataset.save, r = rn[id], lt = meta.n[id];
        if (r && typeof r.t === 'number') {
          const L = lt != null ? lt : 0;
          if (r.t > L) { if (canApply(ta)) { applyNote(ta, r.v || '', r.t); pulled++; } }
          else if (r.t < L) { upd['notes/' + id] = { v: ta.value, t: L }; pushed++; }
        } else if (ta.value !== '' || lt != null) { const t = lt != null ? lt : now; meta.n[id] = t; upd['notes/' + id] = { v: ta.value, t }; pushed++; }
      });
      const api = window.__maluAulas; const local = api ? api.get() : {}; const nl = Object.assign({}, local); let chA = false;
      new Set([...Object.keys(ra), ...Object.keys(local), ...Object.keys(meta.a)]).forEach(k => {
        const r = ra[k], m = meta.a[k], L = m ? m.t : 0, has = !!local[k];
        if (r) {
          if (r.t > L) { if (r.d) nl[k] = r.d; else delete nl[k]; meta.a[k] = { t: r.t, del: !r.d }; chA = true; pulled++; }
          else if (r.t < L) { upd['aulas/' + aPath(k)] = { d: has ? local[k] : '', t: L }; pushed++; }
        } else if (has || m) { const t = m ? m.t : now; meta.a[k] = { t, del: !has }; upd['aulas/' + aPath(k)] = { d: has ? local[k] : '', t }; pushed++; }
      });
      if (chA && api) api.set(nl);
      if (Object.keys(upd).length) await http('PATCH', upd);
      pendN.forEach(id => { if (meta.n[id] === snapshotN[id]) pendN.delete(id); });
      pendA.forEach(k => { if (meta.a[k] && meta.a[k].t === snapshotA[k]) pendA.delete(k); });
      if (pendN.size || pendA.size) schedulePush();
      saveMeta(); lastOk = hhmm(); lastErr = '';
      setStatus('Sincronizado às ' + lastOk + (pulled || pushed ? ' · recebidos ' + pulled + ', enviados ' + pushed : ''), 'ok');
    } catch (e) { lastErr = 'Sem sincronizar: ' + (e && e.message ? e.message : 'falha de conexão'); setStatus(lastErr, 'err'); }
    finally { busy = false; }
  }
  async function pushPending() {
    if (!cfg) return; if (busy) { schedulePush(); return; }
    const upd = {}, snapshotN = {}, snapshotA = {};
    pendN.forEach(id => { const ta = document.querySelector('textarea[data-save="' + id + '"]'); if (ta && meta.n[id] != null) { snapshotN[id] = meta.n[id]; upd['notes/' + id] = { v: ta.value, t: meta.n[id] }; } });
    const api = window.__maluAulas, local = api ? api.get() : {};
    pendA.forEach(k => { const m = meta.a[k]; if (m) { snapshotA[k] = m.t; upd['aulas/' + aPath(k)] = { d: local[k] || '', t: m.t }; } });
    if (!Object.keys(upd).length) return;
    busy = true;
    try { await http('PATCH', upd); pendN.forEach(id => { if (meta.n[id] === snapshotN[id]) pendN.delete(id); }); pendA.forEach(k => { if (meta.a[k] && meta.a[k].t === snapshotA[k]) pendA.delete(k); }); if (pendN.size || pendA.size) schedulePush(); lastOk = hhmm(); lastErr = ''; setStatus('Sincronizado às ' + lastOk, 'ok'); }
    catch (e) { lastErr = 'Sem sincronizar: ' + (e && e.message ? e.message : 'falha de conexão') + ' · tentarei de novo'; setStatus(lastErr, 'err'); }
    finally { busy = false; }
  }
  function schedulePush() { if (!cfg) return; clearTimeout(pushTimer); pushTimer = setTimeout(pushPending, 2500); }

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
    cfg = { url, code }; lsSet(CFG_KEY, cfg); startPolling(); syncNow();
  });
  $('syncNowBtn').addEventListener('click', () => { if (!cfg) { setStatus('Conecte primeiro.', 'err'); return; } syncNow(); });
  $('syncOff').addEventListener('click', () => {
    cfg = null; try { localStorage.removeItem(CFG_KEY); } catch (e) {} clearInterval(pollTimer); lastOk = ''; lastErr = ''; setStatus('Desligado. Suas anotações continuam neste aparelho.', ''); paintBtn();
  });

  cfg = lsGet(CFG_KEY); const m = lsGet(META_KEY); if (m && m.n && m.a) meta = m;
  paintBtn();
  if (cfg) { startPolling(); setTimeout(syncNow, 1500); }
  window.MaluSync = { syncNow, config: () => cfg };
})();

