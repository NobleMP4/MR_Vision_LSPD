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
        rows.forEach(function(row){
            var grade = row.querySelector('.field-grade').value;
            var matricule = row.querySelector('.field-matricule').value.trim();
            var name = row.querySelector('.field-name').value.trim();
            if (grade || matricule || name) entries.push({ grade, matricule, name });
        });
        return entries;
    }

    function readPromoDiv() {
        var rows = listPromoDiv.querySelectorAll('.entry-row');
        var entries = [];
        rows.forEach(function(row){
            var selects = row.querySelectorAll('select');
            var grade = selects[0].value;
            var division = selects[1].value;
            var matricule = row.querySelector('.field-matricule').value.trim();
            var name = row.querySelector('.field-name').value.trim();
            if (grade || division || matricule || name) entries.push({ grade, division, matricule, name });
        });
        return entries;
    }

    function readConvEntries(list) {
        var rows = list.querySelectorAll('.entry-row');
        var entries = [];
        rows.forEach(function(row){
            var matricule = row.querySelector('.field-matricule').value.trim();
            var name = row.querySelector('.field-name').value.trim();
            if (matricule || name) entries.push({ matricule, name });
        });
        return entries;
    }

    function readStripes() {
        var rows = listStripes.querySelectorAll('.entry-row');
        var entries = [];
        rows.forEach(function(row){
            var stripe = row.querySelector('.field-stripes').value;
            var matricule = row.querySelector('.field-matricule').value.trim();
            var name = row.querySelector('.field-name').value.trim();
            if (stripe || matricule || name) entries.push({ stripe, matricule, name });
        });
        return entries;
    }

    // ---- Render ----
    function render() {

        /* =========================
           DATE
        ========================= */
        document.getElementById("summary-date").textContent = fieldDate.value.trim() || "N/A";


        /* =========================
   PROMOTIONS
========================= */
        var promoContainer = document.getElementById("promotions-container");
        promoContainer.innerHTML = "";

        var corpsList = readPromoCorps();
        var divList   = readPromoDiv();

// Vérifie si tout est vide
        if (corpsList.length === 0 && divList.length === 0) {
            promoContainer.innerHTML = `<div class="item status"><span class="center-name">N/A</span></div>`;
        } else {

            if (corpsList.length > 0) {
                promoContainer.innerHTML += `<h3>CORPS D'APPLICATIONS</h3>`;
                corpsList.forEach(function(p){
                    promoContainer.innerHTML += `
                <div class="item status">
                    <div class="names">
                        <span class="main-n">${escapeHTML(p.matricule)} | ${escapeHTML(p.name)}</span>
                        <span class="sub-n">${escapeHTML(p.grade)}</span>
                    </div>
                </div>
            `;
                });
            }

            if (divList.length > 0) {
                promoContainer.innerHTML += `<h3>DIVISION</h3>`;
                divList.forEach(function(p){
                    promoContainer.innerHTML += `
                <div class="item status">
                    <div class="names">
                        <span class="main-n">${escapeHTML(p.matricule)} | ${escapeHTML(p.name)}</span>
                        <span class="sub-n">${escapeHTML(p.grade)} — ${escapeHTML(p.division)}</span>
                    </div>
                </div>
            `;
                });
            }

        }


        /* =========================
   SERVICE STRIPES
========================= */
        var stripesContainer = document.getElementById("stripes-container");
        stripesContainer.innerHTML = "";

        var stripesList = readStripes();

        if (stripesList.length === 0) {
            stripesContainer.innerHTML = `<div class="center-name">N/A</div>`;
        } else {
            stripesList.forEach(function (s) {
                var count = 0;
                if (s.stripe) {
                    var match = s.stripe.match(/\d+/);
                    count = match ? parseInt(match[0], 10) : 0;
                }
                var slashes = '';
                for (var i = 0; i < count; i++) slashes += '<strong>/</strong>';

                stripesContainer.innerHTML += `
        <div class="item status stripe-item">
            <span class="stripe-name">${escapeHTML(s.matricule)} | ${escapeHTML(s.name)}</span>
            <span class="stripe-slashes">${slashes}</span>
        </div>
    `;
            });
        }

        /* =========================
   ARRIVÉES
========================= */
        var arrivals = document.getElementById("arrivals-container");
        arrivals.innerHTML = "";
        var arriveesList = fieldArrivees.value.split("\n").filter(name => name.trim() !== "");
        if (arriveesList.length > 0) {
            arriveesList.forEach(function (name) {
                arrivals.innerHTML += `<div class="item status"><span class="center-name">${escapeHTML(name)}</span></div>`;
            });
        } else {
            arrivals.innerHTML = `<div class="item status"><span class="center-name">N/A</span></div>`;
        }

        /* =========================
           DÉPARTS
        ========================= */
        var departures = document.getElementById("departures-container");
        departures.innerHTML = "";
        var departsList = fieldDeparts.value.split("\n").filter(name => name.trim() !== "");
        if (departsList.length > 0) {
            departsList.forEach(function (name) {
                departures.innerHTML += `<div class="item status"><span class="center-name">${escapeHTML(name)}</span></div>`;
            });
        } else {
            departures.innerHTML = `<div class="item status"><span class="center-name">N/A</span></div>`;
        }


        /* =========================
   RAPPELS
========================= */
        var rappelsContainer = document.getElementById("rappels-container");
        rappelsContainer.innerHTML = "";

        var rappelsList = fieldRappels.value.split("\n").filter(line => line.trim() !== "");

        if (rappelsList.length === 0) {
            // Affiche N/A sans puce
            rappelsContainer.innerHTML = `<div class="center-name">N/A</div>`;
        } else {
            rappelsList.forEach(function (line) {
                rappelsContainer.innerHTML += `<li>${escapeHTML(line)}</li>`;
            });
        }


        /* =========================
   CONVOCATIONS
========================= */
        var convContainer = document.getElementById("convocations-container");
        convContainer.innerHTML = "";

        var convSup = readConvEntries(listConvSup);
        var convWC  = readConvEntries(listConvWC);
        var convCS  = readConvEntries(listConvCS);

// Vérifie si toutes les listes sont vides
        if (convSup.length === 0 && convWC.length === 0 && convCS.length === 0) {
            convContainer.innerHTML = `<div class="item status"><span class="center-name">N/A</span></div>`;
        } else {

            if (convSup.length > 0) {
                convContainer.innerHTML += `<h3>SUPERVISION</h3>`;
                convSup.forEach(function(c){
                    convContainer.innerHTML += `<div class="item status"><span class="center-name">${escapeHTML(c.matricule)} | ${escapeHTML(c.name)}</span></div>`;
                });
            }

            if (convWC.length > 0) {
                convContainer.innerHTML += `<h3>WATCH COMMANDER</h3>`;
                convWC.forEach(function(c){
                    convContainer.innerHTML += `<div class="item status"><span class="center-name">${escapeHTML(c.matricule)} | ${escapeHTML(c.name)}</span></div>`;
                });
            }

            if (convCS.length > 0) {
                convContainer.innerHTML += `<h3>COMMAND STAFF</h3>`;
                convCS.forEach(function(c){
                    convContainer.innerHTML += `<div class="item status"><span class="center-name">${escapeHTML(c.matricule)} | ${escapeHTML(c.name)}</span></div>`;
                });
            }
        }

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
            if (d.promoCorps) d.promoCorps.forEach(addPromoCorpsRow);
            if (d.promoDiv) d.promoDiv.forEach(addPromoDivRow);
            if (d.stripes) d.stripes.forEach(addStripeRow);
            if (d.convSup) d.convSup.forEach(c => addConvRow(listConvSup, c));
            if (d.convWC) d.convWC.forEach(c => addConvRow(listConvWC, c));
            if (d.convCS) d.convCS.forEach(c => addConvRow(listConvCS, c));
            if (d.arrivees) fieldArrivees.value = d.arrivees;
            if (d.departs) fieldDeparts.value = d.departs;
        } catch (_) {}
    }

    // ---- Events ----
    var saveTimer = null;
    function onInput() {
        render();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(save, 400);
    }

    [fieldDate, fieldRappels, fieldArrivees, fieldDeparts].forEach(f => f.addEventListener('input', onInput));

    btnReset.addEventListener('click', function () {
        if (!confirm('Réinitialiser tous les champs ?')) return;
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

    btnDownload.addEventListener('click', function () {
        var doc = document.getElementById('document');
        btnDownload.textContent = 'Génération...';
        btnDownload.disabled = true;

        // Calculer la taille réelle du div
        var rect = doc.getBoundingClientRect();

        html2canvas(doc, {
            width: rect.width,
            height: rect.height,
            scale: 2,           // augmente la résolution pour un PNG net
            useCORS: true,
            backgroundColor: '#111' // ou null si tu veux transparent
        })
            .then(function (canvas) {
                var link = document.createElement('a');
                var slug = fieldDate.value.trim().replace(/[\s\/]+/g, '_') || 'sans_date';
                link.download = 'ceremonie_mission_row_' + slug + '.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            })
            .catch(function (err) {
                console.error('Export failed:', err);
                alert('Erreur lors de l\'export PNG.');
            })
            .finally(function () {
                btnDownload.textContent = 'Télécharger en PNG';
                btnDownload.disabled = false;
            });
    });


    // ---- Init ----
    load();
    render();

})();
