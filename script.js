/* ===================================================
   script.js — Ceremony Report Generator (Mission Row)
   Live preview + PNG export — Dynamic form entries
   =================================================== */

(function () {
    'use strict';

    // ---- Grade lists ----
    var GRADES_CORPS = [
        'Officier I', 'Officier II', 'Officier III',
        'Senior Lead Officer',
        'Sergeant I', 'Sergeant II',
        'Lieutenant', 'Captain'
    ];

    var GRADES_DIVISION = [
        'CS In Charge', 'Commanding Officer', 'Assistant Commanding Officier'
    ];

    var DIVISIONS = [
        'Detective Bureau', 'Traffic Division', 'SWAT', 'K-9',
        'Police Academy', 'Administrative Service Bureau',
        'Crisis Negociation Team', 'Media Relation Division',
        'Air Support Division'
    ];

    var SERVICE_STRIPES = [
        '1 Service Stripe', '2 Service Stripes', '3 Service Stripes',
        '4 Service Stripes', '5 Service Stripes', '6 Service Stripes',
        '7 Service Stripes'
    ];

    // ---- DOM refs ----
    var fieldDate    = document.getElementById('field-date');
    var fieldRappels = document.getElementById('field-rappels');
    var fieldArrivees = document.getElementById('field-arrivees');
    var fieldDeparts  = document.getElementById('field-departs');

    var listPromoCorps = document.getElementById('list-promo-corps');
    var listPromoDiv   = document.getElementById('list-promo-div');
    var listStripes    = document.getElementById('list-stripes');
    var listConvSup    = document.getElementById('list-conv-sup');
    var listConvWC     = document.getElementById('list-conv-wc');
    var listConvCS     = document.getElementById('list-conv-cs');

    var docDate = document.getElementById('doc-date');
    var docBody = document.getElementById('doc-body');

    var btnDownload = document.getElementById('btn-download');
    var btnReset    = document.getElementById('btn-reset');

    var STORAGE_KEY = 'ceremony_mr_draft_v2';

    // ---- Helpers ----

    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function makeOption(value, selected) {
        var opt = document.createElement('option');
        opt.value = value;
        opt.textContent = value;
        if (selected === value) opt.selected = true;
        return opt;
    }

    function makeSelect(options, className, placeholder, selectedValue) {
        var sel = document.createElement('select');
        sel.className = className;
        // Placeholder option
        var ph = document.createElement('option');
        ph.value = '';
        ph.textContent = placeholder;
        ph.disabled = true;
        if (!selectedValue) ph.selected = true;
        sel.appendChild(ph);
        for (var i = 0; i < options.length; i++) {
            sel.appendChild(makeOption(options[i], selectedValue));
        }
        sel.addEventListener('change', onInput);
        return sel;
    }

    function makeInput(className, placeholder, value) {
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = className;
        inp.placeholder = placeholder;
        if (value) inp.value = value;
        inp.addEventListener('input', onInput);
        return inp;
    }

    function makeRemoveBtn(row) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-remove';
        btn.textContent = '\u00d7';
        btn.title = 'Supprimer';
        btn.addEventListener('click', function () {
            row.parentNode.removeChild(row);
            onInput();
        });
        return btn;
    }

    // ---- Create entry rows ----

    function addPromoCorpsRow(data) {
        var row = document.createElement('div');
        row.className = 'entry-row';
        row.appendChild(makeSelect(GRADES_CORPS, 'field-grade', 'Grade...', data && data.grade));
        row.appendChild(makeInput('field-matricule', 'N\u00b0', data && data.matricule));
        row.appendChild(makeInput('field-name', 'Nom Pr\u00e9nom', data && data.name));
        row.appendChild(makeRemoveBtn(row));
        listPromoCorps.appendChild(row);
    }

    function addPromoDivRow(data) {
        var row = document.createElement('div');
        row.className = 'entry-row';
        row.appendChild(makeSelect(GRADES_DIVISION, 'field-grade', 'Grade...', data && data.grade));
        row.appendChild(makeSelect(DIVISIONS, 'field-division', 'Division...', data && data.division));
        row.appendChild(makeInput('field-matricule', 'N\u00b0', data && data.matricule));
        row.appendChild(makeInput('field-name', 'Nom Pr\u00e9nom', data && data.name));
        row.appendChild(makeRemoveBtn(row));
        listPromoDiv.appendChild(row);
    }

    function addConvRow(list, data) {
        var row = document.createElement('div');
        row.className = 'entry-row';
        row.appendChild(makeInput('field-matricule', 'N\u00b0', data && data.matricule));
        row.appendChild(makeInput('field-name', 'Nom Pr\u00e9nom', data && data.name));
        row.appendChild(makeRemoveBtn(row));
        list.appendChild(row);
    }

    function addStripeRow(data) {
        var row = document.createElement('div');
        row.className = 'entry-row';
        row.appendChild(makeSelect(SERVICE_STRIPES, 'field-stripes', 'Stripes...', data && data.stripe));
        row.appendChild(makeInput('field-matricule', 'N\u00b0', data && data.matricule));
        row.appendChild(makeInput('field-name', 'Nom Pr\u00e9nom', data && data.name));
        row.appendChild(makeRemoveBtn(row));
        listStripes.appendChild(row);
    }

    // ---- + Button listeners ----
    document.getElementById('btn-add-promo-corps').addEventListener('click', function () { addPromoCorpsRow(); onInput(); });
    document.getElementById('btn-add-promo-div').addEventListener('click', function () { addPromoDivRow(); onInput(); });
    document.getElementById('btn-add-stripes').addEventListener('click', function () { addStripeRow(); onInput(); });
    document.getElementById('btn-add-conv-sup').addEventListener('click', function () { addConvRow(listConvSup); onInput(); });
    document.getElementById('btn-add-conv-wc').addEventListener('click', function () { addConvRow(listConvWC); onInput(); });
    document.getElementById('btn-add-conv-cs').addEventListener('click', function () { addConvRow(listConvCS); onInput(); });

    // ---- Read entries from DOM ----

    function readPromoCorps() {
        var rows = listPromoCorps.querySelectorAll('.entry-row');
        var entries = [];
        for (var i = 0; i < rows.length; i++) {
            var grade = rows[i].querySelector('.field-grade').value;
            var matricule = rows[i].querySelector('.field-matricule').value.trim();
            var name = rows[i].querySelector('.field-name').value.trim();
            if (grade || matricule || name) {
                entries.push({ grade: grade, matricule: matricule, name: name });
            }
        }
        return entries;
    }

    function readPromoDiv() {
        var rows = listPromoDiv.querySelectorAll('.entry-row');
        var entries = [];
        for (var i = 0; i < rows.length; i++) {
            var selects = rows[i].querySelectorAll('select');
            var grade = selects[0].value;
            var division = selects[1].value;
            var matricule = rows[i].querySelector('.field-matricule').value.trim();
            var name = rows[i].querySelector('.field-name').value.trim();
            if (grade || division || matricule || name) {
                entries.push({ grade: grade, division: division, matricule: matricule, name: name });
            }
        }
        return entries;
    }

    function readConvEntries(list) {
        var rows = list.querySelectorAll('.entry-row');
        var entries = [];
        for (var i = 0; i < rows.length; i++) {
            var matricule = rows[i].querySelector('.field-matricule').value.trim();
            var name = rows[i].querySelector('.field-name').value.trim();
            if (matricule || name) {
                entries.push({ matricule: matricule, name: name });
            }
        }
        return entries;
    }

    function readStripes() {
        var rows = listStripes.querySelectorAll('.entry-row');
        var entries = [];
        for (var i = 0; i < rows.length; i++) {
            var stripe = rows[i].querySelector('.field-stripes').value;
            var matricule = rows[i].querySelector('.field-matricule').value.trim();
            var name = rows[i].querySelector('.field-name').value.trim();
            if (stripe || matricule || name) {
                entries.push({ stripe: stripe, matricule: matricule, name: name });
            }
        }
        return entries;
    }

    // ---- Rendering ----

    function renderStripes() {
        var stripes = readStripes();
        if (stripes.length === 0) return '';
        var html = '';
        for (var i = 0; i < stripes.length; i++) {
            var s = stripes[i];
            var line = '';
            if (s.stripe) line += s.stripe.toUpperCase();
            if (s.matricule) line += ' : ' + s.matricule;
            if (s.name) line += ' | ' + s.name;
            if (line) html += '<div class="doc-entry">' + escapeHTML(line) + '</div>';
        }
        return html;
    }

    function parseRappels(text) {
        if (!text.trim()) return '';
        var lines = text.split('\n');
        var html = '';
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].trim();
            if (!t) {
                html += '<div class="doc-spacer"></div>';
                continue;
            }
            var display = t.charAt(0) === '-' ? t : '- ' + t;
            html += '<div class="doc-rappel">' + escapeHTML(display) + '</div>';
        }
        return html;
    }

    function renderPromotions() {
        var corps = readPromoCorps();
        var div = readPromoDiv();
        var html = '';

        if (corps.length > 0) {
            html += '<div class="doc-subcategory">Corps d\'applications</div>';
            for (var i = 0; i < corps.length; i++) {
                var e = corps[i];
                var line = '';
                if (e.grade) line += e.grade.toUpperCase();
                if (e.matricule) line += ' : ' + e.matricule;
                if (e.name) line += ' | ' + e.name;
                if (line) html += '<div class="doc-entry">' + escapeHTML(line) + '</div>';
            }
        }

        if (div.length > 0) {
            if (corps.length > 0) html += '<div class="doc-spacer"></div>';
            html += '<div class="doc-subcategory">Division</div>';
            for (var j = 0; j < div.length; j++) {
                var d = div[j];
                var dline = '';
                if (d.grade) dline += d.grade.toUpperCase();
                if (d.division) dline += ' ' + d.division.toUpperCase();
                if (d.matricule) dline += ' : ' + d.matricule;
                if (d.name) dline += ' | ' + d.name;
                if (dline) html += '<div class="doc-entry">' + escapeHTML(dline) + '</div>';
            }
        }

        return html;
    }

    function renderConvocations() {
        var sup = readConvEntries(listConvSup);
        var wc = readConvEntries(listConvWC);
        var cs = readConvEntries(listConvCS);
        var html = '';
        var hasContent = false;

        if (sup.length > 0) {
            html += '<div class="doc-subcategory">Superviseur</div>';
            for (var i = 0; i < sup.length; i++) {
                var line = '';
                if (sup[i].matricule) line += sup[i].matricule;
                if (sup[i].name) line += (line ? ' | ' : '') + sup[i].name;
                if (line) html += '<div class="doc-entry">' + escapeHTML(line) + '</div>';
            }
            hasContent = true;
        }

        if (wc.length > 0) {
            if (hasContent) html += '<div class="doc-spacer"></div>';
            html += '<div class="doc-subcategory">Watch Commander</div>';
            for (var j = 0; j < wc.length; j++) {
                var wline = '';
                if (wc[j].matricule) wline += wc[j].matricule;
                if (wc[j].name) wline += (wline ? ' | ' : '') + wc[j].name;
                if (wline) html += '<div class="doc-entry">' + escapeHTML(wline) + '</div>';
            }
            hasContent = true;
        }

        if (cs.length > 0) {
            if (hasContent) html += '<div class="doc-spacer"></div>';
            html += '<div class="doc-subcategory">Command Staff</div>';
            for (var k = 0; k < cs.length; k++) {
                var cline = '';
                if (cs[k].matricule) cline += cs[k].matricule;
                if (cs[k].name) cline += (cline ? ' | ' : '') + cs[k].name;
                if (cline) html += '<div class="doc-entry">' + escapeHTML(cline) + '</div>';
            }
        }

        return html;
    }

    function parseArrivals(text) {
        if (!text.trim()) return '';
        var lines = text.split('\n');
        var html = '';
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].trim();
            if (!t) {
                html += '<div class="doc-spacer"></div>';
            } else {
                html += '<div class="doc-entry-arrival">' + escapeHTML(t) + '</div>';
            }
        }
        return html;
    }

    function parseDepartures(text) {
        if (!text.trim()) return '';
        var lines = text.split('\n');
        var html = '';
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].trim();
            if (!t) {
                html += '<div class="doc-spacer"></div>';
            } else {
                html += '<div class="doc-entry-departure">' + escapeHTML(t) + '</div>';
            }
        }
        return html;
    }

    function makeSection(title, contentHTML) {
        return '<div class="doc-section">' +
            '<div class="doc-section-header"><span>' + escapeHTML(title) + '</span></div>' +
            '<div class="doc-section-content">' + contentHTML + '</div>' +
            '</div>';
    }

    // ---- Storage ----
    function save() {
        var data = {
            date: fieldDate.value,
            rappels: fieldRappels.value,
            promoCorps: readPromoCorps(),
            promoDiv: readPromoDiv(),
            stripes: readStripes(),
            convSup: readConvEntries(listConvSup),
            convWC: readConvEntries(listConvWC),
            convCS: readConvEntries(listConvCS),
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
            if (d.promoCorps) {
                for (var i = 0; i < d.promoCorps.length; i++) addPromoCorpsRow(d.promoCorps[i]);
            }
            if (d.promoDiv) {
                for (var j = 0; j < d.promoDiv.length; j++) addPromoDivRow(d.promoDiv[j]);
            }
            if (d.stripes) {
                for (var s = 0; s < d.stripes.length; s++) addStripeRow(d.stripes[s]);
            }
            if (d.convSup) {
                for (var k = 0; k < d.convSup.length; k++) addConvRow(listConvSup, d.convSup[k]);
            }
            if (d.convWC) {
                for (var l = 0; l < d.convWC.length; l++) addConvRow(listConvWC, d.convWC[l]);
            }
            if (d.convCS) {
                for (var m = 0; m < d.convCS.length; m++) addConvRow(listConvCS, d.convCS[m]);
            }
            if (d.arrivees) fieldArrivees.value = d.arrivees;
            if (d.departs) fieldDeparts.value = d.departs;
        } catch (_) {}
    }

    // ---- Render ----
    function render() {
        // Date
        var dateVal = fieldDate.value.trim();
        docDate.textContent = dateVal || '';

        // Service Stripes — conditional
        var stripesHTML = renderStripes();

        // Build 3 columns
        var col1 = '';
        col1 += makeSection('Rappel de la semaine', parseRappels(fieldRappels.value));
        if (stripesHTML) {
            col1 += makeSection('Service Stripes', stripesHTML);
        }

        var col2 = '';
        col2 += makeSection('Promotions', renderPromotions());

        var col3 = '';
        col3 += makeSection('Convocations', renderConvocations());
        col3 += makeSection('Arriv\u00e9es', parseArrivals(fieldArrivees.value));
        col3 += makeSection('D\u00e9parts', parseDepartures(fieldDeparts.value));

        var html = '';
        html += '<div class="doc-column">' + col1 + '</div>';
        html += '<div class="doc-column">' + col2 + '</div>';
        html += '<div class="doc-column">' + col3 + '</div>';

        docBody.innerHTML = html;
    }

    // ---- Events ----
    var saveTimer = null;
    function onInput() {
        render();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(save, 400);
    }

    // Text fields
    [fieldDate, fieldRappels, fieldArrivees, fieldDeparts].forEach(function (f) {
        f.addEventListener('input', onInput);
    });

    // ---- Reset ----
    btnReset.addEventListener('click', function () {
        if (!confirm('R\u00e9initialiser tous les champs ?')) return;
        fieldDate.value = '';
        fieldRappels.value = '';
        fieldArrivees.value = '';
        fieldDeparts.value = '';
        listPromoCorps.innerHTML = '';
        listPromoDiv.innerHTML = '';
        listStripes.innerHTML = '';
        listConvSup.innerHTML = '';
        listConvWC.innerHTML = '';
        listConvCS.innerHTML = '';
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
    load();
    render();

})();
