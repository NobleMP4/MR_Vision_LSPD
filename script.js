/* ===================================================
   CEREMONY REPORT GENERATOR — LOGIC
   =================================================== */

(function () {
    'use strict';

    // ---- DOM references ----
    const editorPanel  = document.getElementById('editor-panel');
    const previewPanel = document.getElementById('preview-panel');
    const form         = document.getElementById('ceremony-form');

    const fieldDate         = document.getElementById('field-date');
    const fieldRappels      = document.getElementById('field-rappels');
    const fieldPromotions   = document.getElementById('field-promotions');
    const fieldConvocations = document.getElementById('field-convocations');
    const fieldArrivees     = document.getElementById('field-arrivees');
    const fieldDeparts      = document.getElementById('field-departs');

    const btnGenerate = document.getElementById('btn-generate');
    const btnReset    = document.getElementById('btn-reset');
    const btnBack     = document.getElementById('btn-back');
    const btnDownload = document.getElementById('btn-download');

    const docDate = document.getElementById('doc-date');
    const docBody = document.getElementById('doc-body');

    // All form fields for iteration
    const FIELDS = [
        { id: 'field-date',         key: 'date' },
        { id: 'field-rappels',      key: 'rappels' },
        { id: 'field-promotions',   key: 'promotions' },
        { id: 'field-convocations', key: 'convocations' },
        { id: 'field-arrivees',     key: 'arrivees' },
        { id: 'field-departs',      key: 'departs' },
    ];

    // Section definitions (order matters)
    const SECTIONS = [
        { key: 'rappels',      title: 'Rappels de la supervision' },
        { key: 'promotions',   title: 'Promotions' },
        { key: 'convocations', title: 'Convocations' },
        { key: 'arrivees',     title: 'Arrivées' },
        { key: 'departs',      title: 'Départs' },
    ];

    const STORAGE_KEY = 'ceremony_mr_draft';

    // ---- LocalStorage: auto-save ----
    function saveToStorage() {
        const data = {};
        FIELDS.forEach(function (f) {
            data[f.key] = document.getElementById(f.id).value;
        });
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (_) { /* storage full or unavailable — ignore */ }
    }

    function loadFromStorage() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            var data = JSON.parse(raw);
            FIELDS.forEach(function (f) {
                if (data[f.key] !== undefined) {
                    document.getElementById(f.id).value = data[f.key];
                }
            });
        } catch (_) { /* corrupted data — ignore */ }
    }

    // Auto-save on every keystroke (debounced)
    var saveTimer = null;
    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveToStorage, 400);
    }

    FIELDS.forEach(function (f) {
        document.getElementById(f.id).addEventListener('input', scheduleSave);
    });

    // ---- Generate document ----
    function generateDocument() {
        var dateVal = fieldDate.value.trim();
        docDate.textContent = dateVal ? 'Date : ' + dateVal : '';

        // Build sections
        docBody.innerHTML = '';

        SECTIONS.forEach(function (sec) {
            var el = document.getElementById('field-' + sec.key);
            var text = el.value.trim();
            if (!text) return; // skip empty sections

            var section = document.createElement('div');
            section.className = 'doc-section';

            var title = document.createElement('div');
            title.className = 'doc-section-title';
            title.textContent = sec.title;

            var content = document.createElement('div');
            content.className = 'doc-section-content';
            content.textContent = text; // preserves line breaks via white-space: pre-line

            section.appendChild(title);
            section.appendChild(content);
            docBody.appendChild(section);
        });

        // Switch panels
        editorPanel.classList.add('hidden');
        previewPanel.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ---- Back to form ----
    function backToForm() {
        previewPanel.classList.add('hidden');
        editorPanel.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ---- Download PNG ----
    function downloadPNG() {
        var target = document.getElementById('document');

        btnDownload.textContent = 'Génération en cours…';
        btnDownload.disabled = true;

        html2canvas(target, {
            scale: 2,               // high resolution
            useCORS: true,
            backgroundColor: '#ffffff',
        }).then(function (canvas) {
            var link = document.createElement('a');
            var dateSlug = fieldDate.value.trim().replace(/[\/\s]+/g, '_') || 'sans_date';
            link.download = 'ceremonie_mission_row_' + dateSlug + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(function (err) {
            console.error('Export PNG error:', err);
            alert('Erreur lors de la génération PNG. Vérifiez la console.');
        }).finally(function () {
            btnDownload.textContent = 'Télécharger en PNG';
            btnDownload.disabled = false;
        });
    }

    // ---- Reset form ----
    function resetForm() {
        if (!confirm('Réinitialiser tous les champs ? Les données seront perdues.')) return;
        FIELDS.forEach(function (f) {
            document.getElementById(f.id).value = '';
        });
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }

    // ---- Event bindings ----
    btnGenerate.addEventListener('click', generateDocument);
    btnReset.addEventListener('click', resetForm);
    btnBack.addEventListener('click', backToForm);
    btnDownload.addEventListener('click', downloadPNG);

    // ---- Init ----
    loadFromStorage();

})();
