

(() => {
  'use strict';

  const STORAGE_PREFIX = 'malu-';
  const EXPORT_SCHEMA_VERSION = 2;

  const statusEl = document.getElementById('status');
  const searchBox = document.getElementById('searchBox');
  const searchCountEl = document.getElementById('searchCount');
  const importFile = document.getElementById('importFile');
  const openAllBtn = document.getElementById('openAllBtn');
  const closeAllBtn = document.getElementById('closeAllBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  const editableFields = [...document.querySelectorAll('textarea[data-save]')];
  const weekCards = [...document.querySelectorAll('.week-card')];

  function setStatus(message, kind = 'ok') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.kind = kind;
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function storageKey(field) {
    return STORAGE_PREFIX + field.dataset.save;
  }

  function validateFieldIds() {
    const ids = editableFields.map(field => field.dataset.save);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    const invalid = ids.filter(id => !/^[a-z0-9-]+$/i.test(id));

    if (duplicates.length) {
      setStatus(`Atenção: ${new Set(duplicates).size} ID(s) de campo duplicado(s).`, 'error');
      return false;
    }
    if (invalid.length) {
      setStatus(`Atenção: ${invalid.length} ID(s) de campo com formato inesperado.`, 'warn');
      return false;
    }
    return true;
  }

  function restoreSavedFields() {
    editableFields.forEach(field => {
      const saved = localStorage.getItem(storageKey(field));
      if (saved !== null) field.value = saved;
    });
  }

  let statusTimer;
  function saveField(field) {
    try { localStorage.setItem(storageKey(field), field.value); }
    catch (e) { setStatus('Não foi possível salvar neste aparelho. Baixe uma cópia de segurança.', 'error'); document.dispatchEvent(new CustomEvent('malu:storage-error')); return; }
    setStatus(`Salvo neste aparelho às ${formatTime()}`, 'ok');

    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      setStatus(`Salvo neste aparelho · ${formatTime()}`, 'ok');
    }, 2500);
  }

  function initializeAutosave() {
    editableFields.forEach(field => {
      field.addEventListener('input', () => saveField(field));
    });
  }

  function updateSearch() {
    if (!searchBox) return;

    const query = searchBox.value.trim().toLowerCase();
    let visible = 0;

    const activeSection = typeof activeSeries !== 'undefined' && typeof activeDiscipline !== 'undefined'
      ? document.getElementById(`${activeSeries}-${activeDiscipline}`)
      : null;
    const scopedCards = activeSection ? [...activeSection.querySelectorAll('.week-card')] : weekCards;

    weekCards.forEach(card => card.classList.remove('hidden'));
    scopedCards.forEach(card => {
      const haystack = card.textContent.toLowerCase();
      const match = !query || haystack.includes(query);
      card.classList.toggle('hidden', !match);
      if (match) visible += 1;
    });

    if (searchCountEl) {
      searchCountEl.textContent = query
        ? `${visible} de ${scopedCards.length} semanas nesta disciplina`
        : `${scopedCards.length} semanas nesta disciplina`;
    }
    document.dispatchEvent(new CustomEvent('malu:search'));
  }

  function clearSearch() {
    if (!searchBox) return;
    searchBox.value = '';
    updateSearch();
    searchBox.focus();
  }

  function setAllEditors(open) {
    document.querySelectorAll('details.build').forEach(details => {
      details.open = open;
    });
  }

  function collectNotes() {
    const notes = {};
    editableFields.forEach(field => {
      notes[field.dataset.save] = field.value;
    });
    return notes;
  }

  window.exportNotes = function exportNotes() {
    const notes = collectNotes();
    const payload = {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      title: 'Planejamento Unificado — 4º Bimestre — Ciências Humanas',
      exportedAt: new Date().toISOString(),
      fieldCount: Object.keys(notes).length,
      notes
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: 'application/json' }
    );

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_planejamento_4bimestre_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);

    setStatus(`Backup exportado às ${formatTime()}`, 'ok');
  };

  function validateImportPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, reason: 'O arquivo não contém um objeto JSON válido.' };
    }
    if (!payload.notes || typeof payload.notes !== 'object' || Array.isArray(payload.notes)) {
      return { ok: false, reason: 'O arquivo não contém a seção “notes”.' };
    }
    return { ok: true };
  }

  function importNotes(payload) {
    const validation = validateImportPayload(payload);
    if (!validation.ok) throw new Error(validation.reason);

    const knownIds = new Set(editableFields.map(field => field.dataset.save));
    let restored = 0;
    let unknown = 0;

    Object.keys(payload.notes).forEach(id => {
      if (!knownIds.has(id)) unknown += 1;
    });

    editableFields.forEach(field => {
      const id = field.dataset.save;
      if (Object.prototype.hasOwnProperty.call(payload.notes, id)) {
        field.value = payload.notes[id] ?? '';
        localStorage.setItem(storageKey(field), field.value);
        restored += 1;
      }
    });

    document.dispatchEvent(new CustomEvent('malu:notes-restored', {detail:{ids:Object.keys(payload.notes)}}));
    return { restored, unknown };
  }

  function initializeImport() {
    if (!importFile) return;

    importFile.addEventListener('change', function () {
      const file = this.files && this.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = () => {
        try {
          const payload = JSON.parse(reader.result);
          const result = importNotes(payload);

          const suffix = result.unknown
            ? ` · ${result.unknown} campo(s) do arquivo não existem nesta versão`
            : '';

          setStatus(
            `${result.restored} campo(s) restaurado(s) às ${formatTime()}${suffix}`,
            result.unknown ? 'warn' : 'ok'
          );
        } catch (error) {
          setStatus(`Importação falhou: ${error.message}`, 'error');
          window.alert(`Não foi possível importar o backup.\n\n${error.message}`);
        }
      };

      reader.onerror = () => {
        setStatus('Importação falhou: não foi possível ler o arquivo.', 'error');
      };

      reader.readAsText(file);
      this.value = '';
    });
  }

  function initializeControls() {
    if (searchBox) searchBox.addEventListener('input', updateSearch);
    if (clearSearchBtn) clearSearchBtn.addEventListener('click', clearSearch);
    if (openAllBtn) openAllBtn.addEventListener('click', () => setAllEditors(true));
    if (closeAllBtn) closeAllBtn.addEventListener('click', () => setAllEditors(false));
  }


  // Navegação por abas reais: mantém em tela somente a turma e a disciplina escolhidas.
  const turmaChoices = [...document.querySelectorAll('.turma-choice')];
  const disciplinaChoices = [...document.querySelectorAll('.disciplina-choice')];
  const seriesSections = [...document.querySelectorAll('section.series[id]')];
  const disciplineSections = [...document.querySelectorAll('section.discipline[id]')];
  let activeSeries = 's9';
  let activeDiscipline = 'historia';

  function markQuickNav() {
    turmaChoices.forEach(btn => btn.classList.toggle('is-active', btn.dataset.series === activeSeries));
    disciplinaChoices.forEach(btn => btn.classList.toggle('is-active', btn.dataset.discipline === activeDiscipline));
  }

  function targetFor(series, discipline) {
    return document.getElementById(`${series}-${discipline}`);
  }

  function normalizeQuickView() {
    if (!targetFor(activeSeries, activeDiscipline)) {
      const fallbackInSeries = ['historia','filosofia','sociologia'].find(d => targetFor(activeSeries, d));
      if (fallbackInSeries) activeDiscipline = fallbackInSeries;
      else {
        const firstSeries = ['s9','s1','s2','s3'].find(s => targetFor(s, activeDiscipline));
        if (firstSeries) activeSeries = firstSeries;
      }
    }
  }

  function applyQuickView({scroll = true} = {}) {
    normalizeQuickView();
    seriesSections.forEach(series => {
      const on = series.id === activeSeries;
      series.hidden = !on;
      if (on) {
        series.querySelectorAll(':scope > section.discipline[id]').forEach(section => {
          section.hidden = section.id !== `${activeSeries}-${activeDiscipline}`;
        });
      }
    });
    markQuickNav();
    updateSearch();
    const target = targetFor(activeSeries, activeDiscipline);
    if (scroll && target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.dispatchEvent(new CustomEvent('malu:selection'));
  }

  function chooseSeries(series) {
    activeSeries = series;
    if (!targetFor(activeSeries, activeDiscipline)) activeDiscipline = 'historia';
    applyQuickView();
  }

  function chooseDiscipline(discipline) {
    activeDiscipline = discipline;
    if (!targetFor(activeSeries, activeDiscipline)) {
      const firstAvailable = ['s1','s2','s3','s9'].find(series => targetFor(series, activeDiscipline));
      if (firstAvailable) activeSeries = firstAvailable;
    }
    applyQuickView();
  }

  function restoreViewFromHash() {
    const hash = (location.hash || '').replace('#','');
    const match = hash.match(/^(s9|s1|s2|s3)-(historia|filosofia|sociologia)(?:-|$)/);
    if (match) {
      activeSeries = match[1];
      activeDiscipline = match[2];
    }
  }

  function initializeQuickNav() {
    restoreViewFromHash();
    turmaChoices.forEach(btn => btn.addEventListener('click', () => chooseSeries(btn.dataset.series)));
    disciplinaChoices.forEach(btn => btn.addEventListener('click', () => chooseDiscipline(btn.dataset.discipline)));

    document.querySelectorAll('.series-head .chip[href^="#"]').forEach(chip => {
      chip.addEventListener('click', event => {
        const id = chip.getAttribute('href').slice(1);
        const match = id.match(/^(s9|s1|s2|s3)-(historia|filosofia|sociologia)$/);
        if (!match) return;
        event.preventDefault();
        activeSeries = match[1];
        activeDiscipline = match[2];
        applyQuickView();
      });
    });

    applyQuickView({scroll:false});
  }

  function initialize() {
    const idsOk = validateFieldIds();
    restoreSavedFields();
    initializeAutosave();
    initializeImport();
    initializeControls();
    initializeQuickNav();
    updateSearch();

    if (idsOk) {
      setStatus(
        `Salvamento local ativo · ${editableFields.length} campos verificados · faça backup antes de trocar de navegador`,
        'ok'
      );
    }
  }

  initialize();
  window.MaluPlanner = {
    getSelection: () => ({s:activeSeries,d:activeDiscipline}),
    setSelection: (s,d) => { activeSeries=s; activeDiscipline=d; applyQuickView({scroll:false}); },
    updateSearch
  };
})();


