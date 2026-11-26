/* Citoyens en action — mode édition des employés
   Connexion depuis le bouton « Espace employés », puis modification en place de tout le site :
   textes, boutons et liens, photos, listes (activités, nouvelles…), sections et blocs ajoutés. */
(function () {
  'use strict';
  var CEA = window.CEA;
  if (!CEA || !document.getElementById('site-header')) return;

  var esc = CEA.esc;
  var root = document.documentElement;
  var K = { session: 'cea-admin-session', user: 'cea-admin-user', edit: 'cea-edit', min: 'cea-panel-min' };

  // Prototype : le compte de démonstration est vérifié dans le navigateur.
  // La version finale vérifiera la connexion sur le serveur (mot de passe chiffré, session sécurisée).
  var ACCOUNTS = [{ user: 'jane', pass: '123', name: 'Jane' }];

  /* ---------- Utilitaires ---------- */
  function sGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function sDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  function logged() { return sGet(K.session) === '1'; }
  function C() { return CEA.content(); }
  function lang() { return CEA.lang(); }
  function get(o, p) { return p.split('.').reduce(function (x, k) { return x == null ? undefined : x[k]; }, o); }
  function set(o, p, v) {
    var ks = p.split('.'), last = ks.pop();
    var t = ks.reduce(function (x, k) { if (!x[k] || typeof x[k] !== 'object') x[k] = {}; return x[k]; }, o);
    t[last] = v;
  }
  function frDate(iso) {
    if (!iso) return '';
    try { return new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso + 'T12:00:00')); }
    catch (e) { return iso; }
  }
  function uid(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }
  function node(h) { var t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; }
  function htmlToText(h) {
    var t = document.createElement('template');
    t.innerHTML = String(h || '').replace(/<br\s*\/?>/gi, '\n');
    return t.content.textContent;
  }
  function find(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
  function mainEl() { return document.getElementById('contenu'); }
  function lastSection() {
    var s = mainEl().querySelectorAll('[data-sec]');
    return s.length ? Number(s[s.length - 1].getAttribute('data-sec')) : -1;
  }

  var editing = false;

  /* ---------- Enregistrement et annulation ---------- */
  var undoStack = [];
  function snapshot() {
    undoStack.push(JSON.stringify(C()));
    if (undoStack.length > 40) undoStack.shift();
    updateUndo();
  }
  function updateUndo() { var b = document.getElementById('cea-undo'); if (b) b.disabled = !undoStack.length; }
  function undo() {
    if (!undoStack.length) return;
    CEA.setContent(JSON.parse(undoStack.pop()));
    CEA.save();
    CEA.refresh();
    updateUndo();
    toast('Dernière modification annulée.');
    showHome();
  }

  var FULL = 'Le navigateur manque d\'espace : la modification n\'est pas enregistrée. Utilisez une photo plus légère, ou « Publier » pour garder une copie.';
  // Enregistre puis redessine le site ; si le navigateur est plein, on revient en arrière
  function commit(msg, focusSel) {
    if (!CEA.save()) {
      if (undoStack.length) CEA.setContent(JSON.parse(undoStack.pop()));
      CEA.refresh(); updateUndo(); toast(FULL, true);
      return false;
    }
    CEA.refresh();
    if (msg) toast(msg);
    if (focusSel) { var f = document.querySelector(focusSel); if (f) f.focus(); }
    return true;
  }
  var saveTimer;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { if (!CEA.save()) toast(FULL, true); }, 400);
  }

  var toastTimer;
  function toast(msg, isError) {
    var t = document.getElementById('cea-toast');
    if (!t) { CEA.announce(msg); return; }
    t.className = 'cea-toast' + (isError ? ' is-error' : '');
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.textContent = ''; }, 7000);
  }

  /* ---------- Connexion ---------- */
  function openLogin() {
    var d = document.getElementById('cea-login');
    if (!d) {
      d = node(
        '<dialog id="cea-login" class="cea-ui cea-dialog" aria-labelledby="cea-login-title">' +
          '<form novalidate>' +
            '<h2 id="cea-login-title">Espace employés</h2>' +
            '<p class="cea-muted">Connectez-vous pour modifier le contenu du site.</p>' +
            '<div class="field"><label for="cea-user">Nom d\'employé</label><input type="text" id="cea-user" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>' +
            '<div class="field"><label for="cea-pass">Mot de passe</label><input type="password" id="cea-pass" autocomplete="current-password" required></div>' +
            '<p class="form-status is-error" id="cea-login-err" role="alert" hidden></p>' +
            '<div class="btn-row"><button type="submit" class="btn">Se connecter</button>' +
            '<button type="button" class="btn btn-quiet" data-close>Annuler</button></div>' +
            '<p class="cea-note">Prototype : la connexion est simulée dans le navigateur.</p>' +
          '</form>' +
        '</dialog>');
      document.body.appendChild(d);
      d.querySelector('[data-close]').addEventListener('click', function () { d.close(); });
      d.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var u = document.getElementById('cea-user'), p = document.getElementById('cea-pass');
        var err = document.getElementById('cea-login-err');
        var acc = ACCOUNTS.filter(function (a) { return a.user === u.value.trim().toLowerCase() && a.pass === p.value; })[0];
        u.removeAttribute('aria-invalid'); p.removeAttribute('aria-invalid');
        if (!u.value.trim() || !p.value) {
          err.hidden = false; err.textContent = 'Entrez votre nom d\'employé et votre mot de passe.';
          (u.value.trim() ? p : u).setAttribute('aria-invalid', 'true');
          (u.value.trim() ? p : u).focus();
          return;
        }
        if (!acc) {
          err.hidden = false; err.textContent = 'Nom d\'employé ou mot de passe incorrect. Vérifiez et réessayez.';
          p.setAttribute('aria-invalid', 'true'); p.value = ''; p.focus();
          return;
        }
        sSet(K.session, '1'); sSet(K.user, acc.name);
        d.close();
        startEditing();
      });
    }
    d.querySelector('#cea-login-err').hidden = true;
    d.querySelector('#cea-pass').value = '';
    d.showModal();
    d.querySelector('#cea-user').focus();
  }

  /* ---------- Mode édition ---------- */
  function startEditing(silent) {
    editing = true;
    sSet(K.edit, '1');
    root.classList.add('cea-editing');
    buildPanel();
    CEA.refresh();
    if (!silent) {
      var h = document.getElementById('cea-panel-title');
      if (h) h.focus();
      toast('Mode édition activé. Cliquez sur un texte, une photo ou un bouton « Modifier ».');
    }
  }

  function stopEditing() {
    editing = false;
    sDel(K.edit);
    clearTimeout(saveTimer); CEA.save();
    root.classList.remove('cea-editing', 'cea-panel-open');
    var p = document.getElementById('cea-panel');
    if (p) p.remove();
    document.querySelectorAll('.cea-ui:not(dialog)').forEach(function (n) { n.remove(); });
    document.querySelectorAll('[data-cea-edit]').forEach(function (el) {
      ['contenteditable', 'data-cea-edit', 'data-cea-inter', 'spellcheck'].forEach(function (a) { el.removeAttribute(a); });
    });
    document.querySelectorAll('[data-cea-photo]').forEach(function (b) {
      ['data-cea-photo', 'tabindex', 'role', 'aria-label'].forEach(function (a) { b.removeAttribute(a); });
    });
    CEA.refresh();
    var s = document.getElementById('btn-staff');
    if (s) s.focus();
  }

  function logout() {
    stopEditing();
    sDel(K.session); sDel(K.user);
    CEA.refresh();
    var s = document.getElementById('btn-staff');
    if (s) s.focus();
    CEA.announce('Vous êtes déconnecté.');
  }

  /* ---------- Panneau d'édition ---------- */
  var PAGES = [
    ['index', 'index.html', 'Accueil'], ['involve', 'impliquer.html', 'S\'impliquer'], ['activities', 'activites.html', 'Activités'],
    ['initiatives', 'initiatives.html', 'Nos initiatives'], ['news', 'nouvelles.html', 'Nouvelles'], ['team', 'equipe.html', 'Équipe'],
    ['partners', 'partenaires.html', 'Partenaires'], ['contact', 'contact.html', 'Contact'], ['donate', 'don.html', 'Faire un don']
  ];

  var ICONS = {
    text: '<path d="M5 6h14M5 10h14M5 14h10M5 18h7"/>',
    imagetext: '<rect x="3" y="5" width="9" height="14" rx="1.5"/><path d="M15 8h6M15 12h6M15 16h4"/>',
    cta: '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M10 12h4"/>',
    cards: '<rect x="3" y="5" width="5" height="14" rx="1"/><rect x="9.5" y="5" width="5" height="14" rx="1"/><rect x="16" y="5" width="5" height="14" rx="1"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
  }

  function buildPanel() {
    if (document.getElementById('cea-panel')) return;
    var p = node(
      '<aside id="cea-panel" class="cea-ui cea-keep cea-panel" aria-labelledby="cea-panel-title">' +
        '<div class="cea-panel-head">' +
          '<div><p class="cea-kicker">Mode édition</p><h2 id="cea-panel-title" tabindex="-1">Bonjour ' + esc(sGet(K.user) || 'Jane') + '</h2></div>' +
          '<button type="button" class="cea-icon-btn" id="cea-min" aria-expanded="true" aria-controls="cea-panel-body">' +
            '<span aria-hidden="true">–</span><span class="sr-only">Réduire le panneau d\'édition</span></button>' +
        '</div>' +
        '<div class="cea-panel-body" id="cea-panel-body">' +
          '<div class="cea-langbar" id="cea-langbar"></div>' +
          '<div id="cea-view"></div>' +
        '</div>' +
        '<div class="cea-panel-foot">' +
          '<p id="cea-toast" class="cea-toast" role="status" aria-live="polite"></p>' +
          '<div class="cea-foot-btns">' +
            '<button type="button" class="btn btn-quiet" id="cea-undo" disabled><span aria-hidden="true">↶</span> Annuler</button>' +
            '<button type="button" class="btn" id="cea-publish">Publier</button>' +
            '<button type="button" class="btn btn-quiet" id="cea-exit">Terminer</button>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="cea-fab" id="cea-fab" aria-controls="cea-panel-body" aria-expanded="false">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' +
          '<span>Édition</span><span class="sr-only"> : ouvrir le panneau</span></button>' +
      '</aside>');
    document.body.appendChild(p);
    document.getElementById('cea-min').addEventListener('click', function () { setMin(true); document.getElementById('cea-fab').focus(); });
    document.getElementById('cea-fab').addEventListener('click', function () { setMin(false); document.getElementById('cea-panel-title').focus(); });
    document.getElementById('cea-undo').addEventListener('click', undo);
    document.getElementById('cea-publish').addEventListener('click', publish);
    document.getElementById('cea-exit').addEventListener('click', stopEditing);
    setMin(sGet(K.min) === '1');
    updateUndo();
    showHome(true);
  }

  function setMin(min) {
    var p = document.getElementById('cea-panel');
    if (!p) return;
    if (min) sSet(K.min, '1'); else sDel(K.min);
    p.classList.toggle('is-min', min);
    root.classList.toggle('cea-panel-open', !min);
    document.getElementById('cea-min').setAttribute('aria-expanded', String(!min));
    document.getElementById('cea-fab').setAttribute('aria-expanded', String(!min));
  }

  function updateLangbar() {
    var b = document.getElementById('cea-langbar');
    if (!b) return;
    var fr = lang() === 'fr';
    b.innerHTML = 'Vous modifiez la version <strong>' + (fr ? 'française' : 'anglaise') + '</strong> du site. ' +
      '<button type="button" class="cea-link-btn" id="cea-switch">Passer à la version ' + (fr ? 'anglaise' : 'française') + '</button>';
    document.getElementById('cea-switch').addEventListener('click', function () {
      CEA.setLang(fr ? 'en' : 'fr');
      if (currentRef) { var el = refEl(currentRef); if (el) showText(el); }
      var s = document.getElementById('cea-switch');
      if (s) s.focus();
    });
  }

  var backFn = null;
  function view(h, focusSel) {
    var v = document.getElementById('cea-view');
    if (!v) return;
    v.innerHTML = h;
    var body = document.getElementById('cea-panel-body');
    if (body) body.scrollTop = 0;
    if (focusSel) { var f = v.querySelector(focusSel); if (f) f.focus(); }
  }
  function backBtn() { return '<button type="button" class="cea-back" data-cea-act="back"><span aria-hidden="true">←</span> Retour</button>'; }

  function tile(act, attrs, ico, name, desc) {
    return '<li><button type="button" class="cea-tile" data-cea-act="' + act + '"' + attrs + '>' + ico +
      '<span class="cea-tile-name">' + esc(name) + '</span>' + (desc ? '<span class="cea-tile-desc">' + esc(desc) + '</span>' : '') + '</button></li>';
  }
  function blockTiles(after) {
    return '<ul class="cea-tiles" role="list">' + Object.keys(BLOCK_TYPES).map(function (k) {
      return tile('newblock', ' data-type="' + k + '" data-after="' + after + '"', icon(k), BLOCK_TYPES[k].name, BLOCK_TYPES[k].desc);
    }).join('') + '</ul>';
  }

  function showHome(noFocus) {
    currentRef = null;
    var page = CEA.page;
    view(
      '<h3 id="cea-home-title" tabindex="-1">Comment modifier</h3>' +
      '<ul class="cea-tips">' +
        '<li><strong>Textes :</strong> cliquez sur n\'importe quel texte de la page et tapez.</li>' +
        '<li><strong>Boutons, liens et menu :</strong> cliquez dessus pour changer le texte et l\'adresse ici.</li>' +
        '<li><strong>Photos :</strong> cliquez sur une photo pour la remplacer.</li>' +
        '<li><strong>Listes :</strong> boutons « Modifier » et « + Ajouter » directement sur la page.</li>' +
        '<li><strong>Sections :</strong> masquez-en une ou ajoutez un bloc juste en dessous.</li>' +
      '</ul>' +
      '<h3>Ajouter un bloc au bas de cette page</h3>' + blockTiles(lastSection()) +
      '<h3>Contenus du site</h3>' +
      '<ul class="cea-tiles cea-tiles-small" role="list">' +
        Object.keys(COLLS).map(function (k) {
          return tile('coll', ' data-coll="' + k + '"', '<span class="cea-count">' + C()[k].length + '</span>', COLLS[k].title, '');
        }).join('') +
        tile('settings', '', '<span class="cea-count" aria-hidden="true">i</span>', 'Coordonnées, heures et annonce', '') +
      '</ul>' +
      '<h3>Aller à une page</h3>' +
      '<ul class="cea-pages" role="list">' + PAGES.map(function (p) {
        var cur = p[0] === page || (page === 'home' && p[0] === 'index');
        return '<li><a href="' + p[1] + '"' + (cur ? ' aria-current="page"' : '') + '>' + esc(p[2]) + '</a></li>';
      }).join('') + '</ul>' +
      '<p class="cea-small"><a href="admin.html">Sauvegardes et gestion avancée</a></p>' +
      '<p class="cea-small"><button type="button" class="cea-link-btn" data-cea-act="logout">Se déconnecter</button></p>',
      noFocus ? null : '#cea-home-title');
    backFn = null;
    updateLangbar();
  }

  /* ---------- Formulaires du panneau ---------- */
  function fieldHtml(f, v, i) {
    var id = 'cea-f-' + i;
    var req = f.req ? ' required aria-required="true"' : '';
    var star = f.req ? ' <span class="req" aria-hidden="true">*</span>' : '';
    var lg = /\.en$/.test(f.k) ? ' lang="en"' : '';
    var hint = f.hint ? '<span class="hint" id="' + id + '-h">' + esc(f.hint) + '</span>' : '';
    var db = f.hint ? ' aria-describedby="' + id + '-h"' : '';
    if (f.type === 'photo') {
      return '<fieldset class="cea-photo-field"><legend>' + esc(f.label) + star + '</legend>' + hint +
        '<div class="cea-photo-prev" id="' + id + '-prev">' + previewHtml(v) + '</div>' +
        '<input type="hidden" id="' + id + '" value="' + esc(v) + '">' +
        '<input class="sr-only cea-file" type="file" accept="image/*" id="' + id + '-file" data-photo-for="' + id + '">' +
        '<div class="btn-row"><label class="btn btn-quiet cea-file-btn" for="' + id + '-file">Choisir une photo sur l\'ordinateur</label></div>' +
        '<div class="field"><label for="' + id + '-url">Ou adresse d\'une image en ligne</label>' +
        '<input type="url" id="' + id + '-url" data-photo-url="' + id + '" placeholder="https://…" value="' + (/^https?:/i.test(v) ? esc(v) : '') + '"></div>' +
        '</fieldset>';
    }
    var ctl;
    if (f.type === 'textarea') {
      ctl = '<textarea id="' + id + '" rows="4"' + req + lg + db + '>' + esc(v) + '</textarea>';
    } else if (f.type === 'select') {
      ctl = '<select id="' + id + '"' + req + db + '>' + (f.req ? '<option value="">Choisir</option>' : '') +
        f.opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    } else {
      ctl = '<input type="' + (f.type || 'text') + '" id="' + id + '" value="' + esc(v) + '"' + req + lg + db + '>';
    }
    return '<div class="field"><label for="' + id + '">' + esc(f.label) + star + '</label>' + hint + ctl + '</div>';
  }
  function previewHtml(v) {
    var src = CEA.safeImg(v);
    return src ? '<img alt="" src="' + esc(src) + '">' : '<span>Aucune photo choisie</span>';
  }

  // Réduit la photo choisie (max. 1400 px, JPEG) pour qu'elle tienne dans le navigateur
  function readImage(file, done) {
    if (!/^image\//.test(file.type)) { toast('Ce fichier n\'est pas une image.', true); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1400, w = img.naturalWidth, h = img.naturalHeight;
        var r = Math.min(1, max / Math.max(w, h));
        var cv = document.createElement('canvas');
        cv.width = Math.round(w * r); cv.height = Math.round(h * r);
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        done(cv.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () { toast('Impossible de lire cette image. Essayez un fichier JPG ou PNG.', true); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* o : { title, intro, fields, values, onSave(valeurs), extra:[{label, fn, danger}], back } */
  function openForm(o) {
    var vals = o.values || {};
    backFn = o.back || showHome;
    view(backBtn() +
      '<h3 id="cea-form-title" tabindex="-1">' + esc(o.title) + '</h3>' +
      (o.intro ? '<p class="cea-muted">' + esc(o.intro) + '</p>' : '') +
      '<form id="cea-form" class="cea-form" novalidate>' +
        o.fields.map(function (f, i) { var v = get(vals, f.k); return fieldHtml(f, v == null ? '' : String(v), i); }).join('') +
        '<p class="form-status" id="cea-form-status" role="alert"></p>' +
        '<div class="btn-row"><button type="submit" class="btn">Enregistrer</button>' +
        '<button type="button" class="btn btn-quiet" data-cea-act="back">Annuler</button></div>' +
        (o.extra || []).map(function (x, i) {
          return '<p class="cea-small"><button type="button" class="cea-link-btn' + (x.danger ? ' is-danger' : '') + '" data-extra="' + i + '">' + esc(x.label) + '</button></p>';
        }).join('') +
      '</form>', '#cea-form-title');

    var form = document.getElementById('cea-form');
    function setPhoto(id, v) {
      document.getElementById(id).value = v;
      document.getElementById(id + '-prev').innerHTML = previewHtml(v);
    }
    form.querySelectorAll('[data-photo-for]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var file = inp.files && inp.files[0];
        if (!file) return;
        readImage(file, function (data) {
          setPhoto(inp.getAttribute('data-photo-for'), data);
          var u = document.getElementById(inp.getAttribute('data-photo-for') + '-url'); if (u) u.value = '';
          CEA.announce('Photo choisie. Appuyez sur Enregistrer pour la mettre en ligne.');
        });
      });
    });
    form.querySelectorAll('[data-photo-url]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var v = inp.value.trim();
        if (v && /^https?:\/\//i.test(v)) setPhoto(inp.getAttribute('data-photo-url'), v);
      });
    });
    form.querySelectorAll('[data-extra]').forEach(function (b) {
      b.addEventListener('click', function () { o.extra[Number(b.getAttribute('data-extra'))].fn(); });
    });
    form.addEventListener('input', function (e) { if (e.target.removeAttribute) e.target.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = [], out = {};
      o.fields.forEach(function (f, i) {
        var el = document.getElementById('cea-f-' + i);
        var v = (el.value || '').trim();
        var target = f.type === 'photo' ? document.getElementById('cea-f-' + i + '-file') : el;
        el.removeAttribute('aria-invalid');
        var msg = '';
        if (f.req && !v) msg = 'à remplir';
        else if (v && f.check) msg = f.check(v);
        else if (v && f.type === 'email' && !el.checkValidity()) msg = 'adresse courriel non valide';
        if (msg) { bad.push({ el: target, txt: f.label + ' (' + msg + ')' }); if (f.type !== 'photo') el.setAttribute('aria-invalid', 'true'); }
        set(out, f.k, v);
      });
      var st = document.getElementById('cea-form-status');
      if (bad.length) {
        st.className = 'form-status is-error';
        st.textContent = 'À corriger : ' + bad.map(function (b) { return b.txt; }).join(' ; ') + '.';
        bad[0].el.focus();
        return;
      }
      if (o.onSave(out) !== false) backFn();
    });
  }

  function linkCheck(v) { return CEA.safeHref(v) ? '' : 'lien non valide'; }
  function bi(k, label, type, req, hint) {
    return [{ k: k + '.fr', label: label + ' (français)', type: type, req: req, hint: hint },
            { k: k + '.en', label: label + ' (anglais)', type: type, req: req }];
  }

  /* ---------- Listes du site ---------- */
  var CATS = [['benevolat', 'Bénévolat'], ['entraide', 'Entraide'], ['evenement', 'Rencontre'], ['atelier', 'Atelier'], ['sensibilisation', 'Sensibilisation']];
  var TIERS = [['or', 'Partenaire or'], ['argent', 'Partenaire argent'], ['ami', 'Ami de l\'organisme']];
  function label(opts, v) { var o = opts.filter(function (x) { return x[0] === v; })[0]; return o ? o[1] : v; }

  var COLLS = {
    activities: {
      title: 'Activités et calendrier', one: 'une activité', idp: 'a',
      name: function (it) { return get(it, 'title.fr') || ''; },
      sub: function (it) { return frDate(it.date) + (it.time ? ' · ' + it.time : '') + ' · ' + label(CATS, it.category); },
      sort: function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); },
      fields: [{ k: 'date', label: 'Date', type: 'date', req: true }, { k: 'time', label: 'Heure', type: 'time', req: true },
               { k: 'category', label: 'Catégorie', type: 'select', opts: CATS, req: true }]
        .concat(bi('title', 'Titre', 'text', true), bi('place', 'Lieu', 'text', true), bi('desc', 'Description', 'textarea', true))
    },
    news: {
      title: 'Articles et nouvelles', one: 'une nouvelle', idp: 'n',
      name: function (it) { return get(it, 'title.fr') || ''; },
      sub: function (it) { return frDate(it.date); },
      sort: function (a, b) { return b.date.localeCompare(a.date); },
      fields: [{ k: 'date', label: 'Date de publication', type: 'date', req: true }]
        .concat(bi('title', 'Titre', 'text', true), bi('summary', 'Résumé', 'textarea', true), bi('body', 'Texte complet', 'textarea', false))
    },
    initiatives: {
      title: 'Nos initiatives', one: 'une initiative', idp: 'i',
      note: 'Pour la photo, cliquez ensuite sur la photo de l\'initiative, directement sur la page Nos initiatives.',
      name: function (it) { return get(it, 'title.fr') || ''; },
      sub: function (it) { return it.year || ''; },
      fields: [{ k: 'year', label: 'Année', req: true }]
        .concat(bi('title', 'Titre', 'text', true), bi('desc', 'Description', 'textarea', true), bi('impact', 'Résultat (ex. « 64 familles jumelées »)', 'text', false))
    },
    team: {
      title: 'Équipe (employés)', one: 'un employé', idp: 't',
      name: function (it) { return it.name || ''; },
      sub: function (it) { return get(it, 'role.fr') || ''; },
      fields: [{ k: 'name', label: 'Nom complet', req: true }].concat(bi('role', 'Poste', 'text', true),
               [{ k: 'langs', label: 'Langues parlées', hint: 'Ex. : Français, English, Español' }])
    },
    volunteers: {
      title: 'Bénévoles', one: 'un bénévole', idp: 'v',
      name: function (it) { return it.name || ''; },
      sub: function (it) { return get(it, 'role.fr') || ''; },
      fields: [{ k: 'name', label: 'Nom complet', req: true }].concat(bi('role', 'Rôle', 'text', true))
    },
    partners: {
      title: 'Organismes partenaires', one: 'un partenaire', idp: 'p',
      name: function (it) { return it.name || ''; },
      sub: function (it) { return get(it, 'desc.fr') || ''; },
      fields: [{ k: 'name', label: 'Nom de l\'organisme', req: true }].concat(bi('desc', 'Description', 'text', true))
    },
    sponsors: {
      title: 'Commanditaires', one: 'un commanditaire', idp: 's',
      name: function (it) { return it.name || ''; },
      sub: function (it) { return label(TIERS, it.tier); },
      fields: [{ k: 'name', label: 'Nom', req: true }, { k: 'tier', label: 'Catégorie', type: 'select', opts: TIERS, req: true }]
    }
  };
  var RENDER_COLL = { upcoming: 'activities', news: 'news', initiatives: 'initiatives', team: 'team', volunteers: 'volunteers', partners: 'partners', sponsors: 'sponsors' };

  function showColl(coll) {
    var cfg = COLLS[coll];
    var items = C()[coll].slice();
    if (cfg.sort) items.sort(cfg.sort);
    backFn = showHome;
    view(backBtn() +
      '<h3 id="cea-list-title" tabindex="-1">' + esc(cfg.title) + ' <span class="cea-muted">(' + items.length + ')</span></h3>' +
      '<p><button type="button" class="btn" data-cea-act="add" data-coll="' + coll + '" data-from="list">+ Ajouter ' + esc(cfg.one) + '</button></p>' +
      (items.length ? '<ul class="cea-list" role="list">' + items.map(function (it) {
        var n = esc(cfg.name(it));
        return '<li><div class="cea-list-text"><strong>' + n + '</strong><span>' + esc(cfg.sub(it)) + '</span></div>' +
          '<div class="cea-list-btns">' +
            '<button type="button" class="btn btn-quiet" data-cea-act="item-edit" data-coll="' + coll + '" data-id="' + esc(it.id) + '" data-from="list">Modifier<span class="sr-only"> : ' + n + '</span></button>' +
            '<button type="button" class="btn btn-quiet cea-danger" data-cea-act="item-del" data-coll="' + coll + '" data-id="' + esc(it.id) + '" data-from="list">Supprimer<span class="sr-only"> : ' + n + '</span></button>' +
          '</div></li>';
      }).join('') + '</ul>' : '<p class="empty">Aucun élément pour le moment.</p>'),
      '#cea-list-title');
  }

  function openItem(coll, id, back) {
    var cfg = COLLS[coll], list = C()[coll];
    var item = id ? find(list, id) : null;
    if (id && !item) return;
    openForm({
      title: item ? 'Modifier « ' + cfg.name(item) + ' »' : 'Ajouter ' + cfg.one,
      intro: (cfg.note ? cfg.note + ' ' : '') + 'Remplissez les deux langues pour que le site reste bilingue.',
      fields: cfg.fields, values: item || {}, back: back,
      extra: item ? [{ label: 'Supprimer cet élément', danger: true, fn: function () { delItem(coll, id, back); } }] : null,
      onSave: function (v) {
        snapshot();
        var target = item || { id: uid(cfg.idp) };
        cfg.fields.forEach(function (f) { set(target, f.k, get(v, f.k)); });
        if (!item) list.push(target);
        if (!commit('« ' + cfg.name(target) + ' » est enregistré et visible sur le site.')) return false;
        if (coll === 'activities' && target.date < new Date().toISOString().slice(0, 10)) toast('Enregistré. Cette date est passée : l\'activité n\'apparaît plus dans « Activités à venir ».');
      }
    });
  }

  function delItem(coll, id, back) {
    var cfg = COLLS[coll], item = find(C()[coll], id);
    if (!item) return;
    if (!window.confirm('Supprimer « ' + cfg.name(item) + ' » du site ?')) return;
    snapshot();
    C()[coll] = C()[coll].filter(function (x) { return x.id !== id; });
    commit('« ' + cfg.name(item) + ' » a été supprimé. Utilisez « Annuler » au besoin.');
    (back || showHome)();
  }

  /* ---------- Coordonnées, heures et annonce ---------- */
  var hourSeq = 0;
  function hourRow(h) {
    var n = hourSeq++;
    function inp(key, lab, v, en) {
      return '<div class="field"><label for="cea-h' + n + '-' + key + '">' + lab + '</label><input type="text" id="cea-h' + n + '-' + key + '" data-h="' + key + '" value="' + esc(v) + '"' + (en ? ' lang="en"' : '') + '></div>';
    }
    return '<div class="cea-hour" data-hour>' +
      inp('df', 'Jours (français)', get(h, 'days.fr') || '') + inp('tf', 'Heures (français)', get(h, 'time.fr') || '') +
      inp('de', 'Jours (anglais)', get(h, 'days.en') || '', true) + inp('te', 'Heures (anglais)', get(h, 'time.en') || '', true) +
      '<button type="button" class="cea-link-btn is-danger" data-rm-hour>Retirer cette ligne</button></div>';
  }

  function showSettings() {
    var org = C().org, tx = C().texts;
    backFn = showHome;
    view(backBtn() +
      '<h3 id="cea-set-title" tabindex="-1">Coordonnées, heures et annonce</h3>' +
      '<form id="cea-set" class="cea-form" novalidate>' +
        '<div class="field"><label for="cea-s-phone">Téléphone</label><input type="tel" id="cea-s-phone" value="' + esc(org.phone) + '"></div>' +
        '<div class="field"><label for="cea-s-email">Courriel</label><input type="email" id="cea-s-email" value="' + esc(org.email) + '"></div>' +
        '<div class="field"><label for="cea-s-addr">Adresse du local</label><span class="hint" id="cea-s-addr-h">Sert aussi pour la carte de la page Contact.</span>' +
          '<input type="text" id="cea-s-addr" aria-describedby="cea-s-addr-h" value="' + esc(org.address) + '"></div>' +
        '<fieldset><legend>Bandeau d\'annonce (page d\'accueil)</legend><span class="hint">Laissez vide pour cacher le bandeau.</span>' +
          '<div class="field"><label for="cea-s-ann-fr">Français</label><textarea id="cea-s-ann-fr" rows="2">' + esc(tx.fr.announcement || '') + '</textarea></div>' +
          '<div class="field"><label for="cea-s-ann-en">Anglais</label><textarea id="cea-s-ann-en" lang="en" rows="2">' + esc(tx.en.announcement || '') + '</textarea></div>' +
        '</fieldset>' +
        '<fieldset><legend>Heures d\'ouverture</legend><div id="cea-hours">' + org.hours.map(hourRow).join('') + '</div>' +
          '<button type="button" class="btn btn-quiet" id="cea-add-hour">+ Ajouter une ligne</button></fieldset>' +
        '<p class="form-status" id="cea-set-status" role="alert"></p>' +
        '<div class="btn-row"><button type="submit" class="btn">Enregistrer</button><button type="button" class="btn btn-quiet" data-cea-act="back">Annuler</button></div>' +
      '</form>', '#cea-set-title');

    var form = document.getElementById('cea-set');
    document.getElementById('cea-add-hour').addEventListener('click', function () {
      var row = node(hourRow({}));
      document.getElementById('cea-hours').appendChild(row);
      row.querySelector('input').focus();
    });
    form.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm-hour]');
      if (rm) { rm.closest('[data-hour]').remove(); document.getElementById('cea-add-hour').focus(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('cea-s-email');
      var st = document.getElementById('cea-set-status');
      if (email.value.trim() && !email.checkValidity()) {
        st.className = 'form-status is-error'; st.textContent = 'L\'adresse courriel n\'est pas valide.';
        email.setAttribute('aria-invalid', 'true'); email.focus(); return;
      }
      snapshot();
      org.phone = document.getElementById('cea-s-phone').value.trim();
      org.email = email.value.trim();
      org.address = document.getElementById('cea-s-addr').value.trim();
      tx.fr.announcement = document.getElementById('cea-s-ann-fr').value.trim();
      tx.en.announcement = document.getElementById('cea-s-ann-en').value.trim();
      org.hours = Array.prototype.map.call(form.querySelectorAll('[data-hour]'), function (r) {
        function v(k) { return r.querySelector('[data-h="' + k + '"]').value.trim(); }
        return { days: { fr: v('df'), en: v('de') }, time: { fr: v('tf'), en: v('te') } };
      }).filter(function (h) { return h.days.fr || h.days.en || h.time.fr || h.time.en; });
      if (commit('Coordonnées, heures et annonce enregistrées.')) showHome();
    });
  }

  /* ---------- Photos de la page ---------- */
  function openPhoto(box) {
    var key = box.getAttribute('data-src');
    var cur = C().photos[key] || {};
    var alt = cur.alt || {};
    openForm({
      title: 'Changer la photo',
      intro: 'La description est lue à voix haute aux personnes non voyantes : décrivez ce qu\'on voit sur la photo.',
      fields: [{ k: 'url', label: 'Photo', type: 'photo', req: true }]
        .concat(bi('alt', 'Description de la photo', 'text', true)),
      values: { url: cur.url || key, alt: { fr: alt.fr || box.getAttribute('data-alt') || '', en: alt.en || box.getAttribute('data-alt-en') || '' } },
      extra: cur.url || cur.alt ? [{ label: 'Rétablir la photo d\'origine', fn: function () {
        snapshot(); delete C().photos[key];
        if (commit('Photo d\'origine rétablie.')) showHome();
      } }] : null,
      onSave: function (v) {
        snapshot();
        var o = { alt: v.alt };
        if (v.url && v.url !== key) o.url = v.url;
        C().photos[key] = o;
        return commit('Photo enregistrée.');
      }
    });
  }

  function markPhoto(box) {
    if (!editing || box.closest('.cea-block')) return;
    var img = box.querySelector('img');
    var alt = (img && img.alt) || box.getAttribute('data-alt') || '';
    box.setAttribute('data-cea-photo', '');
    box.tabIndex = 0;
    box.setAttribute('role', 'button');
    box.setAttribute('aria-label', 'Changer la photo : ' + alt);
  }
  CEA.onPhoto = markPhoto;

  /* ---------- Blocs ajoutés ---------- */
  var BLOCK_TYPES = {
    text: { name: 'Texte', desc: 'Titre et paragraphes' },
    imagetext: { name: 'Image et texte', desc: 'Photo à côté d\'un texte' },
    cta: { name: 'Appel à l\'action', desc: 'Message et bouton' },
    cards: { name: 'Cartes', desc: '3 encadrés côte à côte' }
  };
  var BG = [['soft', 'Gris clair'], ['white', 'Blanc'], ['ink', 'Bleu foncé'], ['sun', 'Jaune']];

  function blockFields(type) {
    var f = [];
    if (type === 'imagetext') f.push({ k: 'img', label: 'Photo', type: 'photo', req: true });
    f = f.concat(bi('title', 'Titre', 'text', true),
      bi('body', 'Texte', 'textarea', type === 'text', 'Laissez une ligne vide entre deux paragraphes.'));
    if (type === 'imagetext') {
      f = f.concat(bi('alt', 'Description de la photo (lue aux personnes non voyantes)', 'text', true),
        [{ k: 'side', label: 'Position de la photo', type: 'select', opts: [['left', 'À gauche du texte'], ['right', 'À droite du texte']] }]);
    }
    if (type === 'cards') {
      [0, 1, 2].forEach(function (n) {
        f = f.concat(bi('cards.' + n + '.title', 'Carte ' + (n + 1) + ' : titre', 'text', n === 0),
                     bi('cards.' + n + '.text', 'Carte ' + (n + 1) + ' : texte', 'textarea', false));
      });
    }
    f = f.concat(bi('btn', 'Texte du bouton', 'text', type === 'cta', type === 'cta' ? '' : 'Facultatif : laissez vide pour ne pas afficher de bouton.'),
      [{ k: 'href', label: 'Lien du bouton', req: type === 'cta', check: linkCheck, hint: 'Une page du site (ex. don.html) ou une adresse web (https://…).' },
       { k: 'bg', label: 'Couleur de fond', type: 'select', opts: BG }]);
    return f;
  }

  function openBlock(id, type, after) {
    var b = id ? find(C().blocks, id) : null;
    if (id && !b) return;
    type = b ? b.type : type;
    openForm({
      title: (b ? 'Modifier le bloc « ' : 'Nouveau bloc « ') + BLOCK_TYPES[type].name + ' »',
      intro: b ? '' : 'Le bloc sera ajouté à cet endroit de la page. Vous pourrez ensuite le déplacer avec les flèches.',
      fields: blockFields(type),
      values: b || { bg: type === 'cta' ? 'sun' : 'soft', side: 'left' },
      extra: b ? [{ label: 'Supprimer ce bloc', danger: true, fn: function () { delBlock(id); } }] : null,
      onSave: function (v) {
        snapshot();
        var target = b || { id: uid('b'), type: type, page: CEA.page, after: after };
        if (type === 'cards' && !Array.isArray(target.cards)) target.cards = [{}, {}, {}];
        blockFields(type).forEach(function (f) { set(target, f.k, get(v, f.k)); });
        if (!b) C().blocks.push(target);
        if (!commit(b ? 'Bloc mis à jour.' : 'Bloc ajouté à la page.')) return false;
        var el = document.querySelector('[data-block="' + target.id + '"]');
        if (el) el.scrollIntoView({ block: 'center' });
      }
    });
  }

  function delBlock(id) {
    var b = find(C().blocks, id);
    if (!b || !window.confirm('Supprimer ce bloc de la page ?')) return;
    snapshot();
    C().blocks = C().blocks.filter(function (x) { return x.id !== id; });
    commit('Bloc supprimé. Utilisez « Annuler » au besoin.');
    showHome();
  }

  function moveBlock(id, dir) {
    var el = mainEl().querySelector('[data-block="' + id + '"]');
    if (!el) return;
    var sib = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    if (!sib) { toast(dir < 0 ? 'Ce bloc est déjà tout en haut de la page.' : 'Ce bloc est déjà tout en bas de la page.'); return; }
    snapshot();
    var blocks = C().blocks, b = find(blocks, id), i = blocks.indexOf(b);
    if (sib.hasAttribute('data-block')) {
      var o = find(blocks, sib.getAttribute('data-block')), j = blocks.indexOf(o);
      blocks[i] = o; blocks[j] = b;
    } else {
      var k = Number(sib.getAttribute('data-sec'));
      blocks.splice(i, 1);
      if (dir < 0) { b.after = k - 1; blocks.push(b); }
      else {
        b.after = k;
        var first = -1;
        for (var n = 0; n < blocks.length; n++) if (blocks[n].page === b.page && blocks[n].after === k) { first = n; break; }
        if (first < 0) blocks.push(b); else blocks.splice(first, 0, b);
      }
    }
    commit('Bloc déplacé.', '[data-block="' + id + '"] [data-cea-act="blk-' + (dir < 0 ? 'up' : 'down') + '"]');
  }

  function toggleSection(idx) {
    snapshot();
    var all = C().hidden, list = all[CEA.page] = all[CEA.page] || [];
    var p = list.indexOf(idx);
    if (p >= 0) list.splice(p, 1); else list.push(idx);
    commit(p >= 0 ? 'La section est de nouveau visible.' : 'Section masquée pour les visiteurs (elle reste visible, grisée, en mode édition).',
      '[data-sec="' + idx + '"] [data-cea-act="sec-hide"]');
  }

  /* ---------- Textes ---------- */
  var EDITABLE = '[data-en]:not(option), [data-key], [data-i18n]';
  var PLAIN = (function () {
    var d = document.createElement('div');
    try { d.contentEditable = 'plaintext-only'; } catch (e) { return false; }
    return d.contentEditable === 'plaintext-only';
  })();
  var MULTILINE = { P: 1, LI: 1, DD: 1, BLOCKQUOTE: 1 };

  function isInteractive(el) { return !!el.closest('a, button, summary'); }
  function textRef(el) {
    if (el.hasAttribute('data-i18n')) return { kind: 'i18n', key: el.getAttribute('data-i18n'), el: el };
    if (el.hasAttribute('data-key')) return { kind: 'key', key: el.getAttribute('data-key'), el: el };
    return { kind: 'ek', key: el.getAttribute('data-ek'), el: el };
  }
  function refSel(ref) {
    var attr = ref.kind === 'i18n' ? 'data-i18n' : ref.kind === 'key' ? 'data-key' : 'data-ek';
    return '[' + attr + '="' + ref.key.replace(/"/g, '\\"') + '"]';
  }
  function refEl(ref) { return document.querySelector(refSel(ref)); }
  function originalText(ref, l) {
    if (ref.kind === 'i18n') return (window.I18N[l] || {})[ref.key] || window.I18N.fr[ref.key] || '';
    if (ref.kind === 'key') {
      var d = (CEA.defaults().texts || {})[l] || {};
      if (d[ref.key] != null) return d[ref.key];
    }
    var a = ref.el.getAttribute(l === 'en' ? 'data-en' : 'data-fr');
    return a == null ? '' : htmlToText(a);
  }
  function readText(ref, l) {
    var c = C(), v;
    if (ref.kind === 'i18n') { v = c.strings[l][ref.key]; return v ? v : originalText(ref, l); }
    if (ref.kind === 'key') { v = c.texts[l][ref.key]; return v ? v : (ref.key === 'announcement' ? '' : originalText(ref, l)); }
    v = c.overrides[l][ref.key];
    return v != null ? v : originalText(ref, l);
  }
  function writeText(ref, l, v) {
    var c = C();
    if (ref.kind === 'i18n') { if (!v.trim() || v === originalText(ref, l)) delete c.strings[l][ref.key]; else c.strings[l][ref.key] = v; }
    else if (ref.kind === 'key') c.texts[l][ref.key] = v;
    else if (v === originalText(ref, l)) delete c.overrides[l][ref.key];
    else c.overrides[l][ref.key] = v;
    if (l === lang()) {
      document.querySelectorAll(refSel(ref)).forEach(function (el) {
        if (el !== document.activeElement) el.innerHTML = CEA.fmtText(v);
      });
    }
  }
  function describe(el) {
    var where = el.closest('#site-header') ? ' — en-tête, sur toutes les pages' : el.closest('#site-footer') ? ' — pied de page, sur toutes les pages' : '';
    if (el.closest('nav')) return 'Lien du menu' + where;
    if (el.closest('a')) return 'Bouton ou lien' + where;
    if (el.closest('button')) return 'Bouton' + where;
    if (el.closest('summary')) return 'Bouton « lire la suite »' + where;
    if (el.closest('label, legend')) return 'Étiquette de formulaire' + where;
    var t = el.tagName;
    if (/^H[1-4]$/.test(t)) return 'Titre' + where;
    if (t === 'LI') return 'Élément de liste' + where;
    return 'Texte' + where;
  }

  var currentRef = null;
  var snapped = null;
  function snapOnce(token) { if (snapped !== token) { snapshot(); snapped = token; } }

  function showText(el, focusPanel) {
    var ref = textRef(el);
    currentRef = ref;
    backFn = showHome;
    var a = ref.kind === 'ek' && (el.tagName === 'A' ? el : el.closest('a'));
    var orig = a ? (a.getAttribute('data-href-orig') || '') : '';
    view(backBtn() +
      '<h3 id="cea-tx-title" tabindex="-1">Modifier ce texte</h3>' +
      '<p class="cea-muted">' + esc(describe(el)) + '. Les changements s\'enregistrent pendant que vous tapez.</p>' +
      '<div class="field"><label for="cea-tx-fr">Français</label><textarea id="cea-tx-fr" rows="3">' + esc(readText(ref, 'fr')) + '</textarea></div>' +
      '<div class="field"><label for="cea-tx-en">Anglais</label><textarea id="cea-tx-en" lang="en" rows="3">' + esc(readText(ref, 'en')) + '</textarea></div>' +
      (a ? '<div class="field"><label for="cea-tx-link">Adresse du lien</label>' +
        '<span class="hint" id="cea-tx-link-h">Une page du site (ex. contact.html) ou une adresse web (https://…).</span>' +
        '<input type="text" id="cea-tx-link" aria-describedby="cea-tx-link-h" value="' + esc(C().links[ref.key] || orig) + '">' +
        '<p class="field-error" id="cea-tx-link-err"></p></div>' : '') +
      '<p class="cea-small"><button type="button" class="cea-link-btn" id="cea-tx-reset">Rétablir le texte d\'origine</button></p>',
      focusPanel ? '#cea-tx-title' : null);

    ['fr', 'en'].forEach(function (l) {
      document.getElementById('cea-tx-' + l).addEventListener('input', function () {
        snapOnce('panel:' + ref.key);
        writeText(ref, l, this.value);
        saveSoon();
      });
    });
    var link = document.getElementById('cea-tx-link');
    if (link) link.addEventListener('change', function () {
      var v = link.value.trim(), err = document.getElementById('cea-tx-link-err');
      if (v && !CEA.safeHref(v)) {
        err.textContent = 'Ce lien n\'est pas valide.'; link.setAttribute('aria-invalid', 'true'); return;
      }
      err.textContent = ''; link.removeAttribute('aria-invalid');
      snapshot();
      if (!v || v === orig) delete C().links[ref.key]; else C().links[ref.key] = v;
      a.setAttribute('href', CEA.safeHref(v) || orig);
      if (CEA.save()) toast('Lien enregistré.'); else toast(FULL, true);
    });
    document.getElementById('cea-tx-reset').addEventListener('click', function () {
      snapshot();
      ['fr', 'en'].forEach(function (l) {
        if (ref.kind === 'key') C().texts[l][ref.key] = originalText(ref, l);
        else writeText(ref, l, originalText(ref, l));
      });
      delete C().links[ref.key];
      commit('Texte d\'origine rétabli.');
      var again = refEl(ref);
      if (again) showText(again, true);
    });
  }

  /* ---------- Décoration de la page en mode édition ---------- */
  function tools(cls, labelTxt, inner) {
    return node('<div class="cea-ui ' + cls + '" role="group" aria-label="' + esc(labelTxt) + '">' + inner + '</div>');
  }
  function sectionName(s) {
    var h = s.querySelector('h1, h2');
    return h ? h.textContent.trim().replace(/\s+/g, ' ') : 'sans titre';
  }

  function decorate() {
    if (!editing) return;
    document.querySelectorAll('.cea-ui:not(.cea-keep):not(dialog)').forEach(function (n) { n.remove(); });

    document.querySelectorAll(EDITABLE).forEach(function (el) {
      if (el.closest('head, .cea-ui, .skip-link')) return;
      el.setAttribute('data-cea-edit', '');
      if (isInteractive(el)) { el.setAttribute('data-cea-inter', ''); return; }
      if (!el.isContentEditable) { el.contentEditable = PLAIN ? 'plaintext-only' : 'true'; el.spellcheck = true; }
    });

    document.querySelectorAll('.photo[data-src]').forEach(markPhoto);

    document.querySelectorAll('[data-coll][data-id]').forEach(function (li) {
      if (li.closest('.cal-scroll')) return;
      var cfg = COLLS[li.getAttribute('data-coll')];
      var it = find(C()[li.getAttribute('data-coll')], li.getAttribute('data-id'));
      if (!cfg || !it) return;
      var n = esc(cfg.name(it)), a = ' data-coll="' + li.getAttribute('data-coll') + '" data-id="' + esc(it.id) + '"';
      li.appendChild(tools('cea-item-tools', 'Actions : ' + cfg.name(it),
        '<button type="button" data-cea-act="item-edit"' + a + '>Modifier<span class="sr-only"> : ' + n + '</span></button>' +
        '<button type="button" class="cea-danger" data-cea-act="item-del"' + a + '>Supprimer<span class="sr-only"> : ' + n + '</span></button>'));
    });

    document.querySelectorAll('[data-render]').forEach(function (c) {
      var r = c.getAttribute('data-render');
      if (r === 'org') {
        c.after(tools('cea-add-row', 'Coordonnées', '<button type="button" data-cea-act="settings">Modifier les coordonnées et les heures</button>'));
        return;
      }
      var coll = RENDER_COLL[r];
      if (!coll) return;
      c.after(tools('cea-add-row', COLLS[coll].title,
        '<button type="button" data-cea-act="add" data-coll="' + coll + '">+ Ajouter ' + esc(COLLS[coll].one) + '</button>' +
        '<button type="button" data-cea-act="coll" data-coll="' + coll + '">Voir toute la liste (' + C()[coll].length + ')</button>'));
    });

    var hidden = C().hidden[CEA.page] || [];
    mainEl().querySelectorAll('[data-sec]').forEach(function (s) {
      if (s.id === 'announcement') return;
      var i = Number(s.getAttribute('data-sec')), off = hidden.indexOf(i) >= 0, name = sectionName(s);
      s.prepend(tools('cea-sec-tools', 'Section « ' + name + ' »',
        '<span class="cea-tag">' + (off ? 'Masquée aux visiteurs' : 'Section') + '</span>' +
        '<button type="button" data-cea-act="sec-add" data-at="' + i + '">+ Bloc dessous<span class="sr-only"> la section ' + esc(name) + '</span></button>' +
        '<button type="button" data-cea-act="sec-hide" data-at="' + i + '" aria-pressed="' + off + '">' + (off ? 'Afficher' : 'Masquer') + '<span class="sr-only"> la section ' + esc(name) + '</span></button>'));
    });

    mainEl().querySelectorAll('.cea-block').forEach(function (s) {
      var id = s.getAttribute('data-block'), name = sectionName(s);
      var b = ' data-block="' + esc(id) + '"';
      s.prepend(tools('cea-sec-tools is-block', 'Bloc « ' + name + ' »',
        '<span class="cea-tag">Bloc ajouté</span>' +
        '<button type="button" data-cea-act="blk-edit"' + b + '>Modifier<span class="sr-only"> le bloc ' + esc(name) + '</span></button>' +
        '<button type="button" data-cea-act="blk-up"' + b + ' aria-label="Monter le bloc ' + esc(name) + '"><span aria-hidden="true">↑</span></button>' +
        '<button type="button" data-cea-act="blk-down"' + b + ' aria-label="Descendre le bloc ' + esc(name) + '"><span aria-hidden="true">↓</span></button>' +
        '<button type="button" class="cea-danger" data-cea-act="blk-del"' + b + '>Supprimer<span class="sr-only"> le bloc ' + esc(name) + '</span></button>'));
    });

    updateLangbar();
  }
  CEA.onRender = decorate;

  /* ---------- Publier : fichier data.js pour tous les visiteurs ---------- */
  function publish() {
    clearTimeout(saveTimer); CEA.save();
    var data = '/* Contenu exporté depuis le mode édition de Citoyens en action */\nwindow.DEFAULT_CONTENT = ' + JSON.stringify(C(), null, 2) + ';\n';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'text/javascript' }));
    a.download = 'data.js';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('data.js téléchargé. Remplacez le fichier js/data.js du site par celui-ci pour que tous les visiteurs voient vos changements.');
  }

  /* ---------- Événements ---------- */
  // Boutons d'action (panneau, barres d'outils, bouton Espace employés)
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    if (e.target.closest('#btn-staff')) {
      e.preventDefault();
      if (!logged()) openLogin();
      else if (editing) stopEditing();
      else startEditing();
      return;
    }
    var b = e.target.closest('[data-cea-act]');
    if (!b || !editing) return;
    var act = b.getAttribute('data-cea-act'), coll = b.getAttribute('data-coll'), id = b.getAttribute('data-id');
    var fromList = b.getAttribute('data-from') === 'list';
    var back = fromList ? function () { showColl(coll); } : showHome;
    var inPanel = !!b.closest('#cea-panel');
    if (!inPanel) setMin(false);
    switch (act) {
      case 'back': (backFn || showHome)(); break;
      case 'logout': logout(); break;
      case 'coll': showColl(coll); break;
      case 'settings': showSettings(); break;
      case 'add': openItem(coll, null, back); break;
      case 'item-edit': openItem(coll, id, back); break;
      case 'item-del': delItem(coll, id, back); break;
      case 'newblock': openBlock(null, b.getAttribute('data-type'), Number(b.getAttribute('data-after'))); break;
      case 'sec-add':
        backFn = showHome;
        view(backBtn() + '<h3 id="cea-choose-title" tabindex="-1">Quel bloc ajouter ?</h3>' +
          '<p class="cea-muted">Il sera placé sous la section « ' + esc(sectionName(mainEl().querySelector('section[data-sec="' + b.getAttribute('data-at') + '"]'))) + ' ».</p>' +
          blockTiles(b.getAttribute('data-at')), '#cea-choose-title');
        break;
      case 'sec-hide': toggleSection(Number(b.getAttribute('data-at'))); break;
      case 'blk-edit': openBlock(b.getAttribute('data-block')); break;
      case 'blk-up': moveBlock(b.getAttribute('data-block'), -1); break;
      case 'blk-down': moveBlock(b.getAttribute('data-block'), 1); break;
      case 'blk-del': delBlock(b.getAttribute('data-block')); break;
    }
  });

  // En mode édition, la page ne navigue pas : un clic sert à choisir quoi modifier
  document.addEventListener('click', function (e) {
    if (!editing || !e.target.closest) return;
    var t = e.target;
    if (t.closest('.cea-ui, dialog, .tools, .menu-toggle, .cal-head')) return;
    var photo = t.closest('[data-cea-photo]');
    if (photo) { e.preventDefault(); e.stopPropagation(); setMin(false); openPhoto(photo); return; }
    var link = t.closest('a, button, summary');
    var ed = t.closest('[data-cea-edit]');
    if (link) {
      var inner = ed || link.querySelector('[data-cea-edit]');
      if (inner || link.tagName === 'A') e.preventDefault();
      if (inner) { setMin(false); showText(inner, true); }
      else if (link.tagName === 'A') toast('Les liens sont désactivés en mode édition. Utilisez « Aller à une page » dans le panneau.');
      return;
    }
    if (ed && t.closest('label')) e.preventDefault();
  }, true);

  document.addEventListener('submit', function (e) {
    if (!editing || e.target.closest('.cea-ui, dialog')) return;
    e.preventDefault(); e.stopPropagation();
    toast('Les formulaires du site sont désactivés pendant la modification.');
  }, true);

  document.addEventListener('focusin', function (e) {
    if (!editing || !e.target.closest) return;
    var el = e.target.closest('[data-cea-edit]');
    if (el && el.isContentEditable) showText(el, false);
  });

  document.addEventListener('input', function (e) {
    if (!editing || !e.target.closest) return;
    var el = e.target.closest('[data-cea-edit]');
    if (!el || !el.isContentEditable) return;
    var ref = textRef(el);
    snapOnce(el);
    var v = el.innerText.replace(/\n+$/, '');
    writeText(ref, lang(), v);
    var ta = document.getElementById('cea-tx-' + lang());
    if (ta && currentRef && currentRef.key === ref.key) ta.value = v;
    saveSoon();
  });
  document.addEventListener('focusout', function (e) { if (e.target === snapped) snapped = null; });

  document.addEventListener('keydown', function (e) {
    if (!editing || !e.target.closest) return;
    var photo = e.target.closest('[data-cea-photo]');
    if (photo && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setMin(false); openPhoto(photo); return; }
    var el = e.target.closest('[data-cea-edit]');
    if (!el || !el.isContentEditable) return;
    if (e.key === 'Escape') { el.blur(); return; }
    if (e.key === 'Enter' && !e.shiftKey && !MULTILINE[el.tagName]) { e.preventDefault(); el.blur(); }
  });

  // Coller du texte sans mise en forme (navigateurs sans « plaintext-only »)
  document.addEventListener('paste', function (e) {
    if (!editing || PLAIN || !e.target.closest) return;
    var el = e.target.closest('[data-cea-edit]');
    if (!el || !el.isContentEditable) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (logged() && sGet(K.edit) === '1') startEditing(true);
  });
})();
