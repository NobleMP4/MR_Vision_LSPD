/* ===================================================
   CEREMONY REPORT — MISSION ROW
   Live preview, landscape 1920×1080
   =================================================== */

(function () {
    'use strict';

    var fieldDate   = document.getElementById('field-date');
    var btnDownload = document.getElementById('btn-download');
    var btnReset    = document.getElementById('btn-reset');
    var docDate     = document.getElementById('doc-date');
    var docBody     = document.getElementById('doc-body');

    var FIELDS = [
        { id: 'field-date',         key: 'date' },
        { id: 'field-rappels',      key: 'rappels' },
        { id: 'field-promotions',   key: 'promotions' },
        { id: 'field-convocations', key: 'convocations' },
        { id: 'field-arrivees',     key: 'arrivees' },
        { id: 'field-departs',      key: 'departs' },
    ];

    var SECTIONS = [
        { key: 'rappels',      title: 'Rappels de la supervision', layout: 'wide' },
        { key: 'promotions',   title: 'Promotions',                layout: 'normal' },
        { key: 'convocations', title: 'Convocations',              layout: 'normal' },
        { key: 'arrivees',     title: 'Arrivées',                  layout: 'normal' },
        { key: 'departs',      title: 'Départs',                   layout: 'normal' },
    ];

    var STORAGE_KEY = 'ceremony_mr_draft';

    // ---- Storage ----
    function save() {
        var data = {};
        FIELDS.forEach(function (f) { data[f.key] = document.getElementById(f.id).value; });
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
    }

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            var data = JSON.parse(raw);
            FIELDS.forEach(function (f) {
                if (data[f.key] !== undefined) document.getElementById(f.id).value = data[f.key];
            });
        } catch (_) {}
    }

    // ---- Preview ----
    function updatePreview() {
        var dateVal = fieldDate.value.trim();
        docDate.textContent = dateVal ? dateVal : '';

        docBody.innerHTML = '';
        var filled = [];

        SECTIONS.forEach(function (sec) {
            var text = document.getElementById('field-' + sec.key).value.trim();
            if (text) filled.push({ title: sec.title, text: text, layout: sec.layout });
        });

        if (!filled.length && !dateVal) {
            var ph = document.createElement('p');
            ph.className = 'doc-placeholder';
            ph.textContent = 'Remplissez le formulaire pour voir la prévisualisation.';
            docBody.appendChild(ph);
            return;
        }

        // If few sections, make them wider
        if (filled.length === 1) filled[0].layout = 'wide';
        if (filled.length === 2) { filled[0].layout = 'wide'; filled[1].layout = 'wide'; }

        filled.forEach(function (sec) {
            var section = document.createElement('div');
            section.className = 'doc-section';
            if (sec.layout === 'wide') section.classList.add('wide');

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

    // ---- Input handler ----
    var saveTimer = null;
    function onInput() {
        updatePreview();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(save, 400);
    }

    FIELDS.forEach(function (f) {
        document.getElementById(f.id).addEventListener('input', onInput);
    });

    // ---- PNG export ----
    btnDownload.addEventListener('click', function () {
        var target = document.getElementById('document');
        btnDownload.textContent = 'Génération...';
        btnDownload.disabled = true;

        var orig = target.style.transform;
        target.style.transform = 'none';

        html2canvas(target, {
            width: 1920,
            height: 1080,
            scale: 1,
            useCORS: true,
            backgroundColor: '#ffffff',
        }).then(function (canvas) {
            target.style.transform = orig;
            var link = document.createElement('a');
            var slug = fieldDate.value.trim().replace(/[\/\s]+/g, '_') || 'sans_date';
            link.download = 'ceremonie_mission_row_' + slug + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(function (err) {
            target.style.transform = orig;
            console.error(err);
            alert('Erreur lors de l\'export PNG.');
        }).finally(function () {
            btnDownload.textContent = 'Télécharger en PNG';
            btnDownload.disabled = false;
        });
    });

    // ---- Reset ----
    btnReset.addEventListener('click', function () {
        if (!confirm('Réinitialiser tous les champs ?')) return;
        FIELDS.forEach(function (f) { document.getElementById(f.id).value = ''; });
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        updatePreview();
    });

    // ---- Init ----
    load();
    updatePreview();

})();
