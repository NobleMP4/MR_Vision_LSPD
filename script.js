/* ===================================================
   CEREMONY REPORT GENERATOR — MISSION ROW
   Live preview, landscape 1920×1080, grid layout
   =================================================== */

(function () {
    'use strict';

    // ---- DOM references ----
    const fieldDate         = document.getElementById('field-date');
    const btnDownload       = document.getElementById('btn-download');
    const btnReset          = document.getElementById('btn-reset');
    const docDate           = document.getElementById('doc-date');
    const docBody           = document.getElementById('doc-body');

    // Field config
    const FIELDS = [
        { id: 'field-date',         key: 'date' },
        { id: 'field-rappels',      key: 'rappels' },
        { id: 'field-promotions',   key: 'promotions' },
        { id: 'field-convocations', key: 'convocations' },
        { id: 'field-arrivees',     key: 'arrivees' },
        { id: 'field-departs',      key: 'departs' },
    ];

    // Section definitions with smart grid spanning
    // layout: "normal" = 1 col, "wide" = full row, "span-2" = 2 cols
    const SECTIONS = [
        { key: 'rappels',      title: 'Rappels de la supervision', layout: 'wide' },
        { key: 'promotions',   title: 'Promotions',                layout: 'normal' },
        { key: 'convocations', title: 'Convocations',              layout: 'normal' },
        { key: 'arrivees',     title: 'Arrivées',                  layout: 'normal' },
        { key: 'departs',      title: 'Départs',                   layout: 'normal' },
    ];

    const STORAGE_KEY = 'ceremony_mr_draft';

    // ---- LocalStorage ----
    function saveToStorage() {
        var data = {};
        FIELDS.forEach(function (f) {
            data[f.key] = document.getElementById(f.id).value;
        });
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
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
        } catch (_) {}
    }

    // ---- Live preview ----
    function updatePreview() {
        var dateVal = fieldDate.value.trim();
        docDate.textContent = dateVal || '';

        docBody.innerHTML = '';
        var hasContent = false;

        // Collect filled sections
        var filled = [];
        SECTIONS.forEach(function (sec) {
            var text = document.getElementById('field-' + sec.key).value.trim();
            if (text) {
                filled.push({ title: sec.title, text: text, layout: sec.layout });
                hasContent = true;
            }
        });

        if (!hasContent && !dateVal) {
            var ph = document.createElement('p');
            ph.className = 'doc-placeholder';
            ph.textContent = 'Remplissez le formulaire pour générer le document...';
            docBody.appendChild(ph);
            return;
        }

        // Smart layout: if only a few sections, make them wider
        if (filled.length === 1) {
            filled[0].layout = 'wide';
        } else if (filled.length === 2) {
            filled.forEach(function (s) { s.layout = 'span-2'; });
            // Actually for 2 items, let them each take half or use span-2 for first
            filled[0].layout = 'wide';
            filled[1].layout = 'wide';
        }

        filled.forEach(function (sec) {
            var section = document.createElement('div');
            section.className = 'doc-section';
            if (sec.layout === 'wide') section.classList.add('wide');
            if (sec.layout === 'span-2') section.classList.add('span-2');

            var title = document.createElement('div');
            title.className = 'doc-section-title';
            title.textContent = sec.title;

            var content = document.createElement('div');
            content.className = 'doc-section-content';
            content.textContent = sec.text;

            section.appendChild(title);
            section.appendChild(content);
            docBody.appendChild(section);
        });
    }

    // Debounce save, instant preview
    var saveTimer = null;
    function onInput() {
        updatePreview();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveToStorage, 400);
    }

    FIELDS.forEach(function (f) {
        document.getElementById(f.id).addEventListener('input', onInput);
    });

    // ---- Download PNG ----
    function downloadPNG() {
        var target = document.getElementById('document');

        btnDownload.textContent = 'GÉNÉRATION...';
        btnDownload.disabled = true;

        // Temporarily remove transform for full-res capture
        var origTransform = target.style.transform;
        target.style.transform = 'none';

        html2canvas(target, {
            width: 1920,
            height: 1080,
            scale: 1,
            useCORS: true,
            backgroundColor: null,
        }).then(function (canvas) {
            target.style.transform = origTransform;

            var link = document.createElement('a');
            var dateSlug = fieldDate.value.trim().replace(/[\/\s]+/g, '_') || 'sans_date';
            link.download = 'ceremonie_mission_row_' + dateSlug + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(function (err) {
            target.style.transform = origTransform;
            console.error('Export PNG error:', err);
            alert('Erreur lors de la génération PNG.');
        }).finally(function () {
            btnDownload.textContent = 'TÉLÉCHARGER EN PNG';
            btnDownload.disabled = false;
        });
    }

    // ---- Reset ----
    function resetForm() {
        if (!confirm('Réinitialiser tous les champs ?')) return;
        FIELDS.forEach(function (f) {
            document.getElementById(f.id).value = '';
        });
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        updatePreview();
    }

    // ---- Bindings ----
    btnDownload.addEventListener('click', downloadPNG);
    btnReset.addEventListener('click', resetForm);

    // ---- Init ----
    loadFromStorage();
    updatePreview();

})();
