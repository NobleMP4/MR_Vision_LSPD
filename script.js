/* ===================================================
   script.js — Ceremony Report Generator (Mission Row)
   Live preview + PNG export — Steel blue theme
   =================================================== */

(function () {
    'use strict';

    // ---- DOM refs ----
    var fieldDate         = document.getElementById('field-date');
    var fieldRappels      = document.getElementById('field-rappels');
    var fieldPromotions   = document.getElementById('field-promotions');
    var fieldConvocations = document.getElementById('field-convocations');
    var fieldArrivees     = document.getElementById('field-arrivees');
    var fieldDeparts      = document.getElementById('field-departs');

    var docDate = document.getElementById('doc-date');
    var docBody = document.getElementById('doc-body');

    var btnDownload = document.getElementById('btn-download');
    var btnReset    = document.getElementById('btn-reset');

    var FIELDS = [fieldDate, fieldRappels, fieldPromotions, fieldConvocations, fieldArrivees, fieldDeparts];

    var STORAGE_KEY = 'ceremony_mr_draft';

    // ---- Placeholder logo (SVG badge silhouette as data URI) ----
    // Used when logo.png is missing or fails to load
    var PLACEHOLDER_LOGO = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" fill="none">' +
        '<path d="M100 10 L145 45 L170 100 L155 160 L100 230 L45 160 L30 100 L55 45 Z" ' +
        'stroke="#5a90b8" stroke-width="3" fill="#0e1f3d"/>' +
        '<circle cx="100" cy="115" r="45" stroke="#5a90b8" stroke-width="2" fill="none"/>' +
        '<circle cx="100" cy="115" r="30" stroke="#3a6a8e" stroke-width="1.5" fill="none"/>' +
        '<text x="100" y="110" text-anchor="middle" font-family="sans-serif" font-size="14" ' +
        'font-weight="bold" fill="#7ba7cc">LSPD</text>' +
        '<text x="100" y="128" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#5a8aaa">LOGO</text>' +
        '<path d="M100 10 L100 40 M55 45 L75 60 M145 45 L125 60" stroke="#3a6a8e" stroke-width="1.5"/>' +
        '</svg>'
    );

    // Apply placeholder to all logo images if they fail to load
    function setupLogoFallbacks() {
        var imgs = ['watermark-img', 'header-logo-img', 'header-logo-img-r'];
        imgs.forEach(function (id) {
            var img = document.getElementById(id);
            if (!img) return;
            img.onerror = function () { this.src = PLACEHOLDER_LOGO; };
            // If already broken (no src or failed)
            if (!img.complete || img.naturalWidth === 0) {
                img.src = PLACEHOLDER_LOGO;
            }
        });
    }

    // ---- Helpers ----

    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** Detect subcategory header (ALL CAPS, no | separator) */
    function isSubcategory(line) {
        var t = line.trim();
        if (!t || t.length < 3) return false;
        if (t.indexOf('|') !== -1) return false;
        if (/^\d/.test(t)) return false;
        if (t.charAt(0) === '-') return false;
        var letters = t.replace(/[^A-ZÀ-Ýa-zà-ý]/g, '');
        if (letters.length < 2) return false;
        var upper = t.replace(/[^A-ZÀ-Ý]/g, '');
        return (upper.length / letters.length) > 0.8;
    }

    /** Parse multiline text with subcategory detection */
    function parseContent(text) {
        if (!text.trim()) return '';
        var lines = text.split('\n');
        var html = '';
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].trim();
            if (!t) {
                html += '<div class="doc-spacer"></div>';
            } else if (isSubcategory(t)) {
                html += '<div class="doc-subcategory">' + escapeHTML(t) + '</div>';
            } else {
                html += '<div class="doc-entry">' + escapeHTML(t) + '</div>';
            }
        }
        return html;
    }

    /** Parse rappels (auto-prefix with dash) */
    function parseRappels(text) {
        if (!text.trim()) return '';
        var lines = text.split('\n');
        var html = '';
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].trim();
            if (!t) { html += '<div class="doc-spacer"></div>'; continue; }
            var display = t.charAt(0) === '-' ? t : '- ' + t;
            html += '<div class="doc-rappel">' + escapeHTML(display) + '</div>';
        }
        return html;
    }

    /** Build one section block */
    function makeSection(title, contentHTML, colClass) {
        return '<div class="doc-section ' + colClass + '">' +
            '<div class="doc-section-header"><span>' + escapeHTML(title) + '</span></div>' +
            '<div class="doc-section-content">' + contentHTML + '</div>' +
            '</div>';
    }

    // ---- Storage ----
    function save() {
        var data = {
            date: fieldDate.value,
            rappels: fieldRappels.value,
            promotions: fieldPromotions.value,
            convocations: fieldConvocations.value,
            arrivees: fieldArrivees.value,
            departs: fieldDeparts.value
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
    }

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            var d = JSON.parse(raw);
            if (d.date) fieldDate.value = d.date;
            if (d.rappels) fieldRappels.value = d.rappels;
            if (d.promotions) fieldPromotions.value = d.promotions;
            if (d.convocations) fieldConvocations.value = d.convocations;
            if (d.arrivees) fieldArrivees.value = d.arrivees;
            if (d.departs) fieldDeparts.value = d.departs;
        } catch (_) {}
    }

    // ---- Render ----

    function render() {
        var dateVal = fieldDate.value.trim();
        docDate.textContent = dateVal || '';

        var rappels      = fieldRappels.value;
        var promotions   = fieldPromotions.value;
        var convocations = fieldConvocations.value;
        var arrivees     = fieldArrivees.value;
        var departs      = fieldDeparts.value;

        var hasR = rappels.trim().length > 0;
        var hasP = promotions.trim().length > 0;
        var hasC = convocations.trim().length > 0;
        var hasA = arrivees.trim().length > 0;
        var hasD = departs.trim().length > 0;

        if (!hasR && !hasP && !hasC && !hasA && !hasD && !dateVal) {
            docBody.innerHTML = '<p class="doc-placeholder">Remplissez le formulaire pour voir la pr\u00e9visualisation.</p>';
            return;
        }

        var html = '';

        if (hasR) html += makeSection('Rappel de la semaine', parseRappels(rappels), 'col-rappels');
        if (hasP) html += makeSection('Promotions', parseContent(promotions), 'col-promotions');
        if (hasC) html += makeSection('Convocations', parseContent(convocations), 'col-convocations');
        if (hasA) html += makeSection('Arriv\u00e9es', parseContent(arrivees), 'col-arrivees');
        if (hasD) html += makeSection('D\u00e9parts', parseContent(departs), 'col-departs');

        docBody.innerHTML = html || '<p class="doc-placeholder">Remplissez le formulaire...</p>';
    }

    // ---- Events ----
    var saveTimer = null;
    function onInput() {
        render();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(save, 400);
    }

    FIELDS.forEach(function (f) { f.addEventListener('input', onInput); });

    // ---- Reset ----
    btnReset.addEventListener('click', function () {
        if (!confirm('R\u00e9initialiser tous les champs ?')) return;
        FIELDS.forEach(function (f) { f.value = ''; });
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        render();
    });

    // ---- PNG Export ----
    btnDownload.addEventListener('click', function () {
        var doc = document.getElementById('document');
        btnDownload.textContent = 'G\u00e9n\u00e9ration...';
        btnDownload.disabled = true;

        var origTransform = doc.style.transform;
        doc.style.transform = 'none';

        html2canvas(doc, {
            width: 1920,
            height: 1080,
            scale: 1,
            useCORS: true,
            backgroundColor: null
        }).then(function (canvas) {
            doc.style.transform = origTransform;
            var link = document.createElement('a');
            var slug = fieldDate.value.trim().replace(/[\s\/]+/g, '_') || 'sans_date';
            link.download = 'ceremonie_mission_row_' + slug + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(function (err) {
            doc.style.transform = origTransform;
            console.error('Export failed:', err);
            alert('Erreur lors de l\'export PNG.');
        }).finally(function () {
            btnDownload.textContent = 'T\u00e9l\u00e9charger en PNG';
            btnDownload.disabled = false;
        });
    });

    // ---- Init ----
    setupLogoFallbacks();
    load();
    render();

})();
