/* Espace employés : modifier le contenu du site sans code (prototype) */
(function () {
  'use strict';
  var CEA = window.CEA;
  var esc = CEA.esc;
  var content = CEA.loadContent();
  var SESSION_KEY = 'cea-admin-session';

  var CATS = [
    ['benevolat', 'Bénévolat'], ['entraide', 'Entraide'], ['evenement', 'Rencontre'],
    ['atelier', 'Atelier'], ['sensibilisation', 'Sensibilisation']
  ];

  /* Description des champs modifiables */
  var SCHEMAS = {
    activities: {
      title: 'Activités et calendrier', singular: 'une activité', idPrefix: 'a',
      sort: function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); },
      columns: [['date', 'Date'], ['time', 'Heure'], ['title.fr', 'Titre'], ['category', 'Catégorie']],
      fields: [
        ['date', 'Date', 'date', true], ['time', 'Heure', 'time', true], ['category', 'Catégorie', 'select', true],
        ['title.fr', 'Titre (français)', 'text', true], ['title.en', 'Title (English)', 'text', true],
        ['place.fr', 'Lieu (français)', 'text', true], ['place.en', 'Place (English)', 'text', true],
        ['desc.fr', 'Description (français)', 'textarea', true], ['desc.en', 'Description (English)', 'textarea', true]
      ]
    },
    news: {
      title: 'Nouvelles', singular: 'une nouvelle', idPrefix: 'n',
      sort: function (a, b) { return b.date.localeCompare(a.date); },
      columns: [['date', 'Date'], ['title.fr', 'Titre']],
      fields: [
        ['date', 'Date de publication', 'date', true],
        ['title.fr', 'Titre (français)', 'text', true], ['title.en', 'Title (English)', 'text', true],
        ['summary.fr', 'Résumé (français)', 'textarea', true], ['summary.en', 'Summary (English)', 'textarea', true],
        ['body.fr', 'Texte complet (français)', 'textarea', false], ['body.en', 'Full text (English)', 'textarea', false]
      ]
    }
  };

  var TEXT_FIELDS = [
    ['announcement', 'Bandeau d\'annonce (laisser vide pour le cacher)'],
    ['home_hero_title', 'Grand titre de l\'accueil'],
    ['home_hero_text', 'Texte sous le grand titre'],
    ['home_mission', 'Texte de la mission'],
    ['home_newsletter', 'Description de l\'infolettre']
  ];

  /* ---------- Utilitaires ---------- */
  function get(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? '' : o[k]; }, obj); }
  function set(obj, path, val) {
    var keys = path.split('.'), last = keys.pop();
    var target = keys.reduce(function (o, k) { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; return o[k]; }, obj);
    target[last] = val;
  }
  function catLabel(v) { var c = CATS.filter(function (c) { return c[0] === v; })[0]; return c ? c[1] : v; }
  function fmt(iso) {
    if (!iso) return '';
    return new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso + 'T12:00:00'));
  }

  var statusTimer;
  function notify(msg, isError) {
    var s = document.getElementById('admin-status');
    s.className = 'form-status admin-toast ' + (isError ? 'is-error' : 'is-success');
    s.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { s.textContent = ''; s.className = 'form-status'; }, 6000);
  }
  function persist(msg) {
    if (CEA.saveContent(content)) notify(msg);
    else notify('Impossible d\'enregistrer dans ce navigateur. Utilisez « Télécharger data.js » pour garder vos changements.', true);
  }

  function inputHtml(id, f, value) {
    var path = f[0], label = f[1], type = f[2], req = f[3];
    var r = req ? ' required' : '';
    var star = req ? ' <span class="req" aria-hidden="true">*</span>' : '';
    var lang = /\.en$/.test(path) ? ' lang="en"' : '';
    var control;
    if (type === 'textarea') {
      control = '<textarea id="' + id + '" name="' + path + '"' + r + lang + ' rows="3">' + esc(value) + '</textarea>';
    } else if (type === 'select') {
      control = '<select id="' + id + '" name="' + path + '"' + r + '><option value="">Choisir</option>' +
        CATS.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === value ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select>';
    } else {
      control = '<input type="' + type + '" id="' + id + '" name="' + path + '" value="' + esc(value) + '"' + r + lang + '>';
    }
    var full = type === 'textarea' ? ' full' : '';
    return '<div class="field' + full + '"><label for="' + id + '">' + label + star + '</label>' + control + '</div>';
  }

  /* ---------- Listes (activités, nouvelles) ---------- */
  function renderList(kind) {
    var schema = SCHEMAS[kind];
    var panel = document.getElementById('panel-' + kind);
    var items = (content[kind] || []).slice().sort(schema.sort);
    var rows = items.map(function (it) {
      return '<tr>' + schema.columns.map(function (c, i) {
        var v = get(it, c[0]);
        if (c[0] === 'date') v = fmt(v);
        if (c[0] === 'category') v = catLabel(v);
        return i === 0 ? '<th scope="row">' + esc(v) + '</th>' : '<td>' + esc(v) + '</td>';
      }).join('') +
      '<td><div class="admin-actions">' +
        '<button type="button" class="btn btn-quiet" data-edit="' + esc(it.id) + '">Modifier<span class="sr-only"> : ' + esc(get(it, 'title.fr')) + '</span></button>' +
        '<button type="button" class="btn btn-danger" data-delete="' + esc(it.id) + '">Supprimer<span class="sr-only"> : ' + esc(get(it, 'title.fr')) + '</span></button>' +
      '</div></td></tr>';
    }).join('');

    panel.innerHTML =
      '<div class="panel-head"><h2>' + schema.title + '</h2>' +
        '<button type="button" class="btn" data-add>Ajouter ' + schema.singular + '</button></div>' +
      (items.length
        ? '<div class="table-scroll"><table class="admin-table"><caption class="sr-only">' + schema.title + ' (' + items.length + ')</caption><thead><tr>' +
            schema.columns.map(function (c) { return '<th scope="col">' + c[1] + '</th>'; }).join('') +
            '<th scope="col">Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<p class="empty">Aucun élément pour le moment. Cliquez sur « Ajouter ' + schema.singular + ' » pour commencer.</p>') +
      '<div class="editor" id="editor-' + kind + '" hidden></div>';

    panel.querySelector('[data-add]').addEventListener('click', function () { openEditor(kind, null); });
    panel.querySelectorAll('[data-edit]').forEach(function (b) {
      b.addEventListener('click', function () { openEditor(kind, b.getAttribute('data-edit')); });
    });
    panel.querySelectorAll('[data-delete]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-delete');
        var it = content[kind].filter(function (x) { return x.id === id; })[0];
        if (!window.confirm('Supprimer « ' + get(it, 'title.fr') + ' »? Cette action retire l\'élément du site.')) return;
        content[kind] = content[kind].filter(function (x) { return x.id !== id; });
        persist('« ' + get(it, 'title.fr') + ' » a été supprimé.');
        renderList(kind);
        document.querySelector('#panel-' + kind + ' [data-add]').focus();
      });
    });
  }

  function openEditor(kind, id) {
    var schema = SCHEMAS[kind];
    var item = id ? content[kind].filter(function (x) { return x.id === id; })[0] : {};
    var box = document.getElementById('editor-' + kind);
    var heading = id ? 'Modifier « ' + esc(get(item, 'title.fr')) + ' »' : 'Ajouter ' + schema.singular;
    box.hidden = false;
    box.innerHTML =
      '<form class="form-card" novalidate>' +
        '<h3 id="editor-title-' + kind + '" tabindex="-1">' + heading + '</h3>' +
        '<p class="form-note">Les champs marqués d\'un * sont obligatoires. Remplissez les deux langues pour que le site reste bilingue.</p>' +
        '<div class="form-grid">' + schema.fields.map(function (f, i) {
          return inputHtml('ed-' + kind + '-' + i, f, get(item, f[0]));
        }).join('') + '</div>' +
        '<div class="btn-row"><button type="submit" class="btn">Enregistrer</button>' +
        '<button type="button" class="btn btn-quiet" data-cancel>Annuler</button></div>' +
        '<p class="form-status" role="status" tabindex="-1"></p>' +
      '</form>';
    var form = box.querySelector('form');
    box.querySelector('h3').focus();
    box.scrollIntoView({ block: 'start' });

    form.querySelector('[data-cancel]').addEventListener('click', function () {
      box.hidden = true; box.innerHTML = '';
      document.querySelector('#panel-' + kind + ' [data-add]').focus();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = [];
      form.querySelectorAll('input, select, textarea').forEach(function (f) {
        f.removeAttribute('aria-invalid');
        if (!f.checkValidity()) { f.setAttribute('aria-invalid', 'true'); bad.push(f); }
      });
      var st = form.querySelector('.form-status');
      if (bad.length) {
        st.className = 'form-status is-error';
        st.textContent = bad.length + ' champ(s) obligatoire(s) à remplir : ' +
          bad.map(function (f) { return form.querySelector('label[for="' + f.id + '"]').textContent.replace('*', '').trim(); }).join(', ') + '.';
        bad[0].focus();
        return;
      }
      var target = id ? item : { id: schema.idPrefix + Date.now().toString(36) };
      form.querySelectorAll('input, select, textarea').forEach(function (f) { set(target, f.name, f.value.trim()); });
      if (!id) content[kind].push(target);
      persist('« ' + get(target, 'title.fr') + ' » est enregistré et visible sur le site.');
      renderList(kind);
      var btn = document.querySelector('#panel-' + kind + ' [data-edit="' + target.id + '"]');
      if (btn) btn.focus();
    });
  }

  /* ---------- Textes de l'accueil ---------- */
  function renderTexts() {
    var panel = document.getElementById('panel-texts');
    content.texts = content.texts || { fr: {}, en: {} };
    panel.innerHTML =
      '<h2>Textes de l\'accueil</h2>' +
      '<form class="form-card" novalidate><div class="form-grid">' +
      TEXT_FIELDS.map(function (f, i) {
        return '<fieldset class="full"><legend>' + f[1] + '</legend><div class="form-grid">' +
          '<div class="field"><label for="tx-fr-' + i + '">Français</label><textarea id="tx-fr-' + i + '" data-lang="fr" data-key="' + f[0] + '" rows="3">' + esc(content.texts.fr[f[0]] || '') + '</textarea></div>' +
          '<div class="field"><label for="tx-en-' + i + '">English</label><textarea lang="en" id="tx-en-' + i + '" data-lang="en" data-key="' + f[0] + '" rows="3">' + esc(content.texts.en[f[0]] || '') + '</textarea></div>' +
          '</div></fieldset>';
      }).join('') +
      '</div><button type="submit" class="btn">Enregistrer les textes</button></form>';
    panel.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      panel.querySelectorAll('textarea').forEach(function (t) {
        content.texts[t.getAttribute('data-lang')][t.getAttribute('data-key')] = t.value.trim();
      });
      persist('Les textes de l\'accueil sont enregistrés.');
    });
  }

  /* ---------- Coordonnées et heures ---------- */
  function renderOrg() {
    var panel = document.getElementById('panel-org');
    var org = content.org;
    panel.innerHTML =
      '<h2>Coordonnées et heures d\'ouverture</h2>' +
      '<form class="form-card" novalidate><div class="form-grid">' +
        '<div class="field"><label for="org-phone">Téléphone</label><input type="tel" id="org-phone" value="' + esc(org.phone) + '"></div>' +
        '<div class="field"><label for="org-email">Courriel</label><input type="email" id="org-email" value="' + esc(org.email) + '"></div>' +
        org.hours.map(function (h, i) {
          return '<fieldset class="full"><legend>Plage horaire ' + (i + 1) + '</legend><div class="form-grid">' +
            '<div class="field"><label for="h-df-' + i + '">Jours (français)</label><input type="text" id="h-df-' + i + '" value="' + esc(h.days.fr) + '"></div>' +
            '<div class="field"><label for="h-tf-' + i + '">Heures (français)</label><input type="text" id="h-tf-' + i + '" value="' + esc(h.time.fr) + '"></div>' +
            '<div class="field"><label for="h-de-' + i + '">Days (English)</label><input type="text" lang="en" id="h-de-' + i + '" value="' + esc(h.days.en) + '"></div>' +
            '<div class="field"><label for="h-te-' + i + '">Hours (English)</label><input type="text" lang="en" id="h-te-' + i + '" value="' + esc(h.time.en) + '"></div>' +
            '</div></fieldset>';
        }).join('') +
      '</div><button type="submit" class="btn">Enregistrer les coordonnées</button></form>';
    panel.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      org.phone = document.getElementById('org-phone').value.trim();
      org.email = document.getElementById('org-email').value.trim();
      org.hours.forEach(function (h, i) {
        h.days.fr = document.getElementById('h-df-' + i).value.trim();
        h.time.fr = document.getElementById('h-tf-' + i).value.trim();
        h.days.en = document.getElementById('h-de-' + i).value.trim();
        h.time.en = document.getElementById('h-te-' + i).value.trim();
      });
      persist('Les coordonnées et les heures sont enregistrées.');
    });
  }

  /* ---------- Sauvegarde ---------- */
  function download(name, text, type) {
    var blob = new Blob([text], { type: type });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function setupBackup() {
    document.getElementById('export-js').addEventListener('click', function () {
      download('data.js', '/* Contenu exporté depuis l\'Espace employés */\nwindow.DEFAULT_CONTENT = ' + JSON.stringify(content, null, 2) + ';\n', 'text/javascript');
      notify('data.js téléchargé. Remplacez le fichier js/data.js du site par celui-ci.');
    });
    document.getElementById('export-json').addEventListener('click', function () {
      download('citoyens-en-action-copie.json', JSON.stringify(content, null, 2), 'application/json');
      notify('Copie de sécurité téléchargée.');
    });
    document.getElementById('import-json').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var c = JSON.parse(reader.result);
          if (!c || !Array.isArray(c.activities) || !c.texts) throw new Error();
          content = CEA.normalize(c);
          persist('Copie chargée. Le site affiche maintenant ce contenu.');
          renderAllPanels();
        } catch (err) {
          notify('Ce fichier n\'est pas une copie valide du contenu. Choisissez un fichier .json exporté depuis cet espace.', true);
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    });
    document.getElementById('reset').addEventListener('click', function () {
      if (!window.confirm('Effacer toutes les modifications faites dans ce navigateur et revenir au contenu d\'origine?')) return;
      CEA.resetContent();
      content = CEA.defaults();
      renderAllPanels();
      notify('Le contenu d\'origine est rétabli.');
    });
  }

  /* ---------- Onglets accessibles ---------- */
  function setupTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n); }
      });
    });
  }

  function renderAllPanels() {
    renderList('activities');
    renderList('news');
    renderTexts();
    renderOrg();
  }

  /* ---------- Connexion simulée ---------- */
  function showDashboard() {
    document.getElementById('login').hidden = true;
    document.getElementById('dashboard').hidden = false;
    renderAllPanels();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupTabs();
    setupBackup();
    document.getElementById('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = document.getElementById('l-user'), p = document.getElementById('l-pass');
      var err = document.getElementById('login-err');
      // Prototype : compte de démonstration vérifié dans le navigateur (le même que le mode édition du site)
      if (u.value.trim().toLowerCase() !== 'jane' || p.value !== '123') {
        err.hidden = false;
        err.textContent = 'Nom d\'employé ou mot de passe incorrect. Vérifiez et réessayez.';
        p.value = ''; p.setAttribute('aria-invalid', 'true'); p.focus();
        return;
      }
      err.hidden = true; p.removeAttribute('aria-invalid');
      try { sessionStorage.setItem(SESSION_KEY, '1'); sessionStorage.setItem('cea-admin-user', 'Jane'); } catch (err2) {}
      showDashboard();
      document.getElementById('dash-title').setAttribute('tabindex', '-1');
      document.getElementById('dash-title').focus();
    });
    document.getElementById('logout').addEventListener('click', function () {
      try { sessionStorage.removeItem(SESSION_KEY); } catch (err) {}
      document.getElementById('dashboard').hidden = true;
      document.getElementById('login').hidden = false;
      document.getElementById('l-user').focus();
    });
    var logged = false;
    try { logged = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (err) {}
    if (logged) showDashboard();
  });
})();
