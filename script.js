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
        'Detective Bureau', 'Traffic Division', 'Métro','SWAT', 'K-9',
        'Police Academy', 'Administrative Service Bureau',
        'Crisis Negociation Team', 'Media Relation Division',
        'Air Support Division'
    ];

    var SERVICE_STRIPES = [
        '1 Service Stripe', '2 Service Stripes', '3 Service Stripes',
        '4 Service Stripes', '5 Service Stripes', '6 Service Stripes',
        '7 Service Stripes'
    ];

    // ---- Division → Grades mapping ----
    var DIVISION_GRADES_MAP = {
        'Detective Bureau': ['CS In Charge', 'Commanding Officer', 'Assistant Commanding Officier'],
        'Traffic Division': ['CS In Charge', 'Commanding Officer', 'Assistant Commanding Officier'],
        'Métro': ['CS In Charge'],
        'SWAT': ['CS In Charge', 'Commanding Officer', 'Assistant Commanding Officier'],
        'K-9': ['CS In Charge', 'Assistant Commanding Officier', 'Assistant Commanding Officier'],
        'Police Academy': ['CS In Charge', 'Commanding Officer', 'Assistant Commanding Officier', 'Instructeur Confirmé', 'Instructeur'],
        'Administrative Service Bureau': ['CS In Charge', 'Commanding Officer', 'Assistant Commanding Officier'],
        'Crisis Negociation Team': ['CS In Charge', 'CS In Charge', 'Assistant Commanding Officier'],
        'Media Relation Division': ['CS In Charge', 'Commanding Officer', 'Assistant Commanding Officier'],
        'Air Support Division': ['CS In Charge', 'Commanding Officer', 'Assistant Commanding Officier']
    };

    // ---- DOM refs ----
    var fieldDate     = document.getElementById('field-date');
    var listRappelsSup = document.getElementById('list-rappels-sup');
    var listRappelsWC  = document.getElementById('list-rappels-wc');
    var listRappelsCS  = document.getElementById('list-rappels-cs');
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
        onInput();
    }

    function addPromoDivRow(data) {
        var row = document.createElement('div');
        row.className = 'entry-row';

        // Division select
        var selDivision = makeSelect(DIVISIONS, 'field-division', 'Division...', data && data.division);
        row.appendChild(selDivision);

        // Grade select (initial)
        var initialGrades = data && data.division ? DIVISION_GRADES_MAP[data.division] || [] : [];
        var selGrade = makeSelect(initialGrades, 'field-grade', 'Grade...', data && data.grade);
        row.appendChild(selGrade);

        // Inputs matricule et nom
        row.appendChild(makeInput('field-matricule', 'N\u00b0', data && data.matricule));
        row.appendChild(makeInput('field-name', 'Nom Pr\u00e9nom', data && data.name));

        row.appendChild(makeRemoveBtn(row));
        listPromoDiv.appendChild(row);

        // Met à jour grades si division change
        selDivision.addEventListener('change', function () {
            var currentGrade = selGrade.value;
            selGrade.innerHTML = '';
            var gradesForDiv = DIVISION_GRADES_MAP[selDivision.value] || [];
            var ph = document.createElement('option');
            ph.value = '';
            ph.textContent = 'Grade...';
            ph.disabled = true;
            ph.selected = !currentGrade;
            selGrade.appendChild(ph);
            gradesForDiv.forEach(function (g) {
                selGrade.appendChild(makeOption(g, currentGrade));
            });
            onInput();
        });

        onInput();
    }

    function addConvRow(list, data) {
        var row = document.createElement('div');
        row.className = 'entry-row';
        row.appendChild(makeInput('field-matricule', 'N\u00b0', data && data.matricule));
        row.appendChild(makeInput('field-name', 'Nom Pr\u00e9nom', data && data.name));
        row.appendChild(makeRemoveBtn(row));
        list.appendChild(row);
        onInput();
    }

    function addRappelRow(list, data) {
        var row = document.createElement('div');
        row.className = 'entry-row';
        row.appendChild(makeInput('field-rappel-text', 'Texte du rappel...', data && data.text));
        row.appendChild(makeRemoveBtn(row));
        list.appendChild(row);
        onInput();
    }

    function addStripeRow(data) {
        var row = document.createElement('div');
        row.className = 'entry-row';
        row.appendChild(makeSelect(SERVICE_STRIPES, 'field-stripes', 'Stripes...', data && data.stripe));
        row.appendChild(makeInput('field-matricule', 'N\u00b0', data && data.matricule));
        row.appendChild(makeInput('field-name', 'Nom Pr\u00e9nom', data && data.name));
        row.appendChild(makeRemoveBtn(row));
        listStripes.appendChild(row);
        onInput();
    }

    // ---- + Button listeners ----
    document.getElementById('btn-add-promo-corps').addEventListener('click', function () { addPromoCorpsRow(); });
    document.getElementById('btn-add-promo-div').addEventListener('click', function () { addPromoDivRow(); });
    document.getElementById('btn-add-stripes').addEventListener('click', function () { addStripeRow(); });
    document.getElementById('btn-add-conv-sup').addEventListener('click', function () { addConvRow(listConvSup); });
    document.getElementById('btn-add-conv-wc').addEventListener('click', function () { addConvRow(listConvWC); });
    document.getElementById('btn-add-conv-cs').addEventListener('click', function () { addConvRow(listConvCS); });
    document.getElementById('btn-add-rappel-sup').addEventListener('click', function () { addRappelRow(listRappelsSup); });
    document.getElementById('btn-add-rappel-wc').addEventListener('click', function () { addRappelRow(listRappelsWC); });
    document.getElementById('btn-add-rappel-cs').addEventListener('click', function () { addRappelRow(listRappelsCS); });

    // ---- Read entries from DOM ----
    function readPromoCorps() {
        return Array.from(listPromoCorps.querySelectorAll('.entry-row')).map(row => {
            return {
                grade: row.querySelector('.field-grade').value,
                matricule: row.querySelector('.field-matricule').value.trim(),
                name: row.querySelector('.field-name').value.trim()
            };
        }).filter(e => e.grade || e.matricule || e.name);
    }

    function readRappelEntries(list) {
        return Array.from(list.querySelectorAll('.entry-row')).map(row => {
            return { text: row.querySelector('.field-rappel-text').value.trim() };
        }).filter(e => e.text);
    }

    function readPromoDiv() {
        return Array.from(listPromoDiv.querySelectorAll('.entry-row')).map(row => {
            var selects = row.querySelectorAll('select');
            return {
                division: selects[0].value,
                grade: selects[1].value,
                matricule: row.querySelector('.field-matricule').value.trim(),
                name: row.querySelector('.field-name').value.trim()
            };
        }).filter(e => e.division || e.grade || e.matricule || e.name);
    }

    function readConvEntries(list) {
        return Array.from(list.querySelectorAll('.entry-row')).map(row => {
            return {
                matricule: row.querySelector('.field-matricule').value.trim(),
                name: row.querySelector('.field-name').value.trim()
            };
        }).filter(e => e.matricule || e.name);
    }

    function readStripes() {
        return Array.from(listStripes.querySelectorAll('.entry-row')).map(row => {
            return {
                stripe: row.querySelector('.field-stripes').value,
                matricule: row.querySelector('.field-matricule').value.trim(),
                name: row.querySelector('.field-name').value.trim()
            };
        }).filter(e => e.stripe || e.matricule || e.name);
    }

    // ---- Render ----
    function render() {
        // DATE
        document.querySelector("#summary-date .summary-text").textContent =
            fieldDate.value.trim() || "N/A";


        // PROMOTIONS
        var promoContainer = document.getElementById("promotions-container");
        promoContainer.innerHTML = "";
        var corpsList = readPromoCorps();
        var divList   = readPromoDiv();

        if (corpsList.length === 0 && divList.length === 0) {
            promoContainer.innerHTML = `<div class="item status"><span class="center-name">N/A</span></div>`;
        } else {
            if (corpsList.length > 0) {
                promoContainer.innerHTML += `<h3>CORPS D'APPLICATION</h3>`;
                corpsList.forEach(function(p){
                    promoContainer.innerHTML += `
                    <div class="item status">
                        <div class="names">
                            <span class="main-n">${escapeHTML(p.matricule)} | ${escapeHTML(p.name)}</span>
                            <span class="sub-n">${escapeHTML(p.grade)}</span>
                        </div>
                    </div>`;
                });
            }
            if (divList.length > 0) {
                promoContainer.innerHTML += `<h3>DIVISIONS</h3>`;
                divList.forEach(function(p){
                    promoContainer.innerHTML += `
                    <div class="item status">
                        <div class="names">
                            <span class="main-n">${escapeHTML(p.matricule)} | ${escapeHTML(p.name)}</span>
                            <span class="sub-n">${escapeHTML(p.division)} — ${escapeHTML(p.grade)}</span>
                        </div>
                    </div>`;
                });
            }
        }

        // SERVICE STRIPES
        var stripesContainer = document.getElementById("stripes-container");
        stripesContainer.innerHTML = "";
        var stripesList = readStripes();
        if (stripesList.length === 0) {
            stripesContainer.innerHTML += `<div class="center-name">N/A</div>`;
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
                    </div>`;
            });
        }

        // ARRIVÉES
        var arrivals = document.getElementById("arrivals-container");
        arrivals.innerHTML = "";
        var arriveesList = fieldArrivees.value.split("\n").filter(name => name.trim() !== "");
        if (arriveesList.length === 0) {
            arrivals.innerHTML = `<div class="item status"><span class="center-name">N/A</span></div>`;
        } else {
            arriveesList.forEach(function(name){
                arrivals.innerHTML += `<div class="item status"><span class="center-name">${escapeHTML(name)}</span></div>`;
            });
        }

        // DÉPARTS
        var departures = document.getElementById("departures-container");
        departures.innerHTML = "";
        var departsList = fieldDeparts.value.split("\n").filter(name => name.trim() !== "");
        if (departsList.length === 0) {
            departures.innerHTML = `<div class="item status"><span class="center-name">N/A</span></div>`;
        } else {
            departsList.forEach(function(name){
                departures.innerHTML += `<div class="item status"><span class="center-name">${escapeHTML(name)}</span></div>`;
            });
        }

        // RAPPELS
        var rappelsContainer = document.getElementById("rappels-container");
        rappelsContainer.innerHTML = "";
        var rSup = readRappelEntries(listRappelsSup);
        var rWC  = readRappelEntries(listRappelsWC);
        var rCS  = readRappelEntries(listRappelsCS);

        if (rSup.length === 0 && rWC.length === 0 && rCS.length === 0) {
            rappelsContainer.innerHTML = `<div class="center-name">N/A</div>`;
        } else {
            var renderRSub = function(title, items) {
                if (items.length > 0) {
                    rappelsContainer.innerHTML += `<h3>${title}</h3><ul class="list">`;
                    items.forEach(function(r) {
                        rappelsContainer.innerHTML += `<li>${escapeHTML(r.text)}</li>`;
                    });
                    rappelsContainer.innerHTML += `</ul>`;
                }
            };
            renderRSub("SUPERVISION", rSup);
            renderRSub("WATCH COMMANDER", rWC);
            renderRSub("COMMAND STAFF", rCS);
        }

        // CONVOCATIONS
        var convContainer = document.getElementById("convocations-container");
        convContainer.innerHTML = "";
        var convSup = readConvEntries(listConvSup);
        var convWC  = readConvEntries(listConvWC);
        var convCS  = readConvEntries(listConvCS);

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
            rappelsSup: readRappelEntries(listRappelsSup),
            rappelsWC: readRappelEntries(listRappelsWC),
            rappelsCS: readRappelEntries(listRappelsCS),
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
            // Nouveaux rappels
            if (d.rappelsSup) d.rappelsSup.forEach(r => addRappelRow(listRappelsSup, r));
            if (d.rappelsWC) d.rappelsWC.forEach(r => addRappelRow(listRappelsWC, r));
            if (d.rappelsCS) d.rappelsCS.forEach(r => addRappelRow(listRappelsCS, r));
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

    // On écoute la date, les arrivées et départs
    [fieldDate, fieldArrivees, fieldDeparts].forEach(f => {
        if (f) f.addEventListener('input', onInput);
    });

    btnReset.addEventListener('click', function () {
        if (!confirm('Réinitialiser tous les champs ?')) return;

        if (fieldDate) fieldDate.value = '';
        if (fieldArrivees) fieldArrivees.value = '';
        if (fieldDeparts) fieldDeparts.value = '';

        // Vider toutes les listes dynamiques
        [listPromoCorps, listPromoDiv, listStripes,
            listConvSup, listConvWC, listConvCS,
            listRappelsSup, listRappelsWC, listRappelsCS].forEach(list => {
            if (list) list.innerHTML = '';
        });

        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        render();
    });

    btnDownload.addEventListener('click', function () {
        var doc = document.getElementById('document');
        btnDownload.textContent = 'Génération...';
        btnDownload.disabled = true;

        var rect = doc.getBoundingClientRect();
        html2canvas(doc, {
            width: rect.width,
            height: rect.height,
            scale: 2,
            useCORS: true,
            backgroundColor: '#111'
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
