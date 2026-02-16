/* ===================================================
   CEREMONY REPORT GENERATOR — LOGIC
   Live preview: updates the document as the user types.
   =================================================== */

(function () {
    'use strict';

    // ---- DOM references ----
    const fieldDate         = document.getElementById('field-date');
    const fieldRappels      = document.getElementById('field-rappels');
    const fieldPromotions   = document.getElementById('field-promotions');
    const fieldConvocations = document.getElementById('field-convocations');
    const fieldArrivees     = document.getElementById('field-arrivees');
    const fieldDeparts      = document.getElementById('field-departs');

    const btnDownload = document.getElementById('btn-download');
    const btnReset    = document.getElementById('btn-reset');

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
        var data = {};
        FIELDS.forEach(function (f) {
            data[f.key] = document.getElementById(f.id).value;
        });
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (_) { /* storage full or unavailable */ }
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
        } catch (_) { /* corrupted data */ }
    }

    // ---- Live preview: rebuild the document on every change ----
    function updatePreview() {
        // Date
        var dateVal = fieldDate.value.trim();
        docDate.textContent = dateVal ? 'Date : ' + dateVal : '';

        // Build sections
        docBody.innerHTML = '';
        var hasContent = false;

        SECTIONS.forEach(function (sec) {
            var el = document.getElementById('field-' + sec.key);
            var text = el.value.trim();
            if (!text) return;

            hasContent = true;

            var section = document.createElement('div');
            section.className = 'doc-section';

            var title = document.createElement('div');
            title.className = 'doc-section-title';
            title.textContent = sec.title;

            var content = document.createElement('div');
            content.className = 'doc-section-content';
            content.textContent = text;

            section.appendChild(title);
            section.appendChild(content);
            docBody.appendChild(section);
        });

        // Show placeholder if nothing filled yet
        if (!hasContent && !dateVal) {
            var ph = document.createElement('p');
            ph.className = 'doc-placeholder';
            ph.textContent = 'Commencez à remplir le formulaire pour voir la prévisualisation...';
            docBody.appendChild(ph);
        }
    }

    // Debounced save + immediate preview
    var saveTimer = null;
    function onFieldInput() {
        updatePreview();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveToStorage, 400);
    }

    FIELDS.forEach(function (f) {
        document.getElementById(f.id).addEventListener('input', onFieldInput);
    });

    // ---- Download PNG ----
    function downloadPNG() {
        var target = document.getElementById('document');

        btnDownload.textContent = 'Génération en cours…';
        btnDownload.disabled = true;

        html2canvas(target, {
            scale: 2,
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
        updatePreview();
    }

    // ---- Event bindings ----
    btnDownload.addEventListener('click', downloadPNG);
    btnReset.addEventListener('click', resetForm);

    // ---- Init ----
    loadFromStorage();
    updatePreview();

})();
