/* Citoyens en action — script principal (langue, menu, contenu modifiable, formulaires) */
(function () {
  'use strict';

  var STORE_KEY = 'cea-content-v1';
  var LANG_KEY = 'cea-lang';
  var A11Y_KEY = 'cea-a11y';

  /* ---------- Stockage ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  function loadContent() {
    var s = storageGet(STORE_KEY);
    if (s) {
      try {
        var c = JSON.parse(s);
        if (c && c.version === window.DEFAULT_CONTENT.version) return c;
      } catch (e) { /* contenu corrompu : on revient au défaut */ }
    }
    return clone(window.DEFAULT_CONTENT);
  }
  function saveContent(c) { return storageSet(STORE_KEY, JSON.stringify(c)); }
  function resetContent() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} }

  var content = loadContent();
  var lang = storageGet(LANG_KEY) === 'en' ? 'en' : 'fr';
  var a11y = { big: false, hc: false };
  try { a11y = Object.assign(a11y, JSON.parse(storageGet(A11Y_KEY) || '{}')); } catch (e) {}

  /* ---------- Utilitaires ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function t(key) {
    var d = window.I18N[lang] || {};
    return d[key] != null ? d[key] : (window.I18N.fr[key] != null ? window.I18N.fr[key] : key);
  }
  function L(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.fr || '';
  }
  function locale() { return lang === 'fr' ? 'fr-CA' : 'en-CA'; }
  function toDate(iso, time) { return new Date(iso + 'T' + (time || '12:00') + ':00'); }
  function fmtDate(iso, opts) { return new Intl.DateTimeFormat(locale(), opts).format(toDate(iso)); }
  function fmtTime(time) {
    return new Intl.DateTimeFormat(locale(), { hour: 'numeric', minute: '2-digit' }).format(toDate('2000-01-01', time));
  }
  function announce(msg) {
    var live = document.getElementById('live');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 50);
  }

  /* ---------- Affichage accessible ---------- */
  function applyA11y() {
    document.documentElement.classList.toggle('big-text', !!a11y.big);
    document.documentElement.classList.toggle('high-contrast', !!a11y.hc);
  }

  /* ---------- En-tête et pied de page ---------- */
  var NAV = [
    ['home', 'index.html', 'nav_home'],
    ['involve', 'impliquer.html', 'nav_involve'],
    ['activities', 'activites.html', 'nav_activities'],
    ['initiatives', 'initiatives.html', 'nav_initiatives'],
    ['news', 'nouvelles.html', 'nav_news'],
    ['team', 'equipe.html', 'nav_team'],
    ['partners', 'partenaires.html', 'nav_partners'],
    ['contact', 'contact.html', 'nav_contact']
  ];

  var LOGO = '<svg class="logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<circle cx="16" cy="18" r="9" fill="var(--blue)"/>' +
    '<circle cx="32" cy="18" r="9" fill="var(--green)"/>' +
    '<circle cx="24" cy="31" r="9" fill="var(--sun)"/>' +
    '<circle cx="24" cy="23" r="3.2" fill="var(--paper)"/></svg>';

  function buildHeader() {
    var h = document.getElementById('site-header');
    if (!h) return;
    var page = document.body.getAttribute('data-page');
    var navItems = NAV.map(function (n) {
      return '<li><a href="' + n[1] + '"' + (n[0] === page ? ' aria-current="page"' : '') + '>' + esc(t(n[2])) + '</a></li>';
    }).join('');
    var org = content.org || {};
    h.innerHTML =
      '<div class="topbar"><div class="wrap topbar-inner">' +
        '<p class="topbar-contact"><a href="tel:' + esc((org.phone || '').replace(/\D/g, '')) + '">' + esc(org.phone) + '</a>' +
        '<a href="mailto:' + esc(org.email) + '">' + esc(org.email) + '</a></p>' +
        '<div class="tools" role="group" aria-label="' + esc(t('a11y_tools')) + '">' +
          '<button type="button" class="tool" id="btn-text" aria-pressed="' + !!a11y.big + '"><span aria-hidden="true" class="tool-ico">A+</span>' + esc(t('text_size')) + '</button>' +
          '<button type="button" class="tool" id="btn-contrast" aria-pressed="' + !!a11y.hc + '"><span aria-hidden="true" class="tool-ico tool-ico-contrast"></span>' + esc(t('contrast')) + '</button>' +
          '<button type="button" class="tool tool-lang" id="btn-lang" lang="' + t('lang_switch_code') + '">' + esc(t('lang_switch')) + '</button>' +
        '</div>' +
      '</div></div>' +
      '<div class="wrap navbar">' +
        '<a class="brand" href="index.html">' + LOGO + '<span class="brand-name">Citoyens en action</span></a>' +
        '<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="main-nav">' +
          '<span class="menu-bars" aria-hidden="true"><span></span><span></span><span></span></span>' +
          '<span class="menu-label">' + esc(t('menu')) + '</span></button>' +
        '<nav id="main-nav" class="main-nav" aria-label="' + esc(t('nav_label')) + '">' +
          '<ul>' + navItems + '</ul>' +
          '<a class="btn btn-donate" href="don.html"' + (page === 'donate' ? ' aria-current="page"' : '') + '>' + esc(t('nav_donate')) + '</a>' +
        '</nav>' +
      '</div>';

    document.getElementById('btn-text').addEventListener('click', function () {
      a11y.big = !a11y.big; this.setAttribute('aria-pressed', a11y.big);
      storageSet(A11Y_KEY, JSON.stringify(a11y)); applyA11y();
    });
    document.getElementById('btn-contrast').addEventListener('click', function () {
      a11y.hc = !a11y.hc; this.setAttribute('aria-pressed', a11y.hc);
      storageSet(A11Y_KEY, JSON.stringify(a11y)); applyA11y();
    });
    document.getElementById('btn-lang').addEventListener('click', function () {
      setLang(lang === 'fr' ? 'en' : 'fr');
      var b = document.getElementById('btn-lang');
      if (b) b.focus();
    });

    var toggle = h.querySelector('.menu-toggle');
    var nav = h.querySelector('.main-nav');
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open);
      toggle.querySelector('.menu-label').textContent = open ? t('menu_close') : t('menu');
      nav.classList.toggle('is-open', open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        toggle.click(); toggle.focus();
      }
    });
  }

  function buildFooter() {
    var f = document.getElementById('site-footer');
    if (!f) return;
    var org = content.org || {};
    var hours = (org.hours || []).map(function (h) {
      return '<div><dt>' + esc(L(h.days)) + '</dt><dd>' + esc(L(h.time)) + '</dd></div>';
    }).join('');
    f.innerHTML =
      '<div class="wrap footer-grid">' +
        '<div class="footer-brand"><p class="footer-name">' + LOGO + 'Citoyens en action</p><p>' + esc(t('footer_tagline')) + '</p>' +
          '<p><a class="footer-link-strong" href="nouvelles.html#infolettre">' + esc(t('footer_newsletter')) + '</a></p></div>' +
        '<div><h2>' + esc(t('footer_visit')) + '</h2><address>945, ch. de Chambly<br>Longueuil (Québec)<br>J4H 4A9</address>' +
          '<p><a href="contact.html#plan">' + esc(t('footer_map')) + '</a></p></div>' +
        '<div><h2>' + esc(t('footer_hours')) + '</h2><dl class="hours">' + hours + '</dl></div>' +
        '<div><h2>' + esc(t('footer_contact')) + '</h2><p><a href="tel:' + esc((org.phone || '').replace(/\D/g, '')) + '">' + esc(org.phone) + '</a><br>' +
          '<a href="mailto:' + esc(org.email) + '">' + esc(org.email) + '</a></p></div>' +
      '</div>' +
      '<div class="wrap footer-bottom"><p>© 2026 Citoyens en action. ' + esc(t('footer_rights')) + '</p>' +
        '<p><a href="admin.html">' + esc(t('footer_admin')) + '</a></p></div>';
  }

  /* ---------- Traduction des textes de page ---------- */
  var ATTRS = ['placeholder', 'aria-label', 'content', 'title', 'alt'];

  function applyLang() {
    document.documentElement.lang = lang;
    var texts = (content.texts && content.texts[lang]) || {};

    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (el.getAttribute('data-fr') === null) el.setAttribute('data-fr', el.innerHTML);
      var key = el.getAttribute('data-key');
      if (key && texts[key]) { el.textContent = texts[key]; return; }
      el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-fr');
    });

    ATTRS.forEach(function (attr) {
      document.querySelectorAll('[data-en-' + attr + ']').forEach(function (el) {
        if (el.getAttribute('data-fr-' + attr) === null) el.setAttribute('data-fr-' + attr, el.getAttribute(attr) || '');
        el.setAttribute(attr, el.getAttribute('data-' + (lang === 'en' ? 'en' : 'fr') + '-' + attr));
      });
    });

    // Bandeau d'annonce (modifiable dans l'espace employés ; vide = caché)
    var ann = document.getElementById('announcement');
    if (ann) {
      var msg = texts.announcement;
      ann.hidden = !msg;
      var p = ann.querySelector('p');
      if (p) p.textContent = msg || '';
    }
  }

  function setLang(l) {
    lang = l;
    storageSet(LANG_KEY, l);
    buildHeader();
    buildFooter();
    applyLang();
    renderAll();
    announce(t('lang_changed'));
  }

  /* ---------- Photos : remplacez simplement les fichiers dans /images ---------- */
  var CAMERA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h3l2-2.5h6L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  function photoAlt(box) {
    return lang === 'en' ? (box.getAttribute('data-alt-en') || box.getAttribute('data-alt')) : box.getAttribute('data-alt');
  }

  function renderPhotos(root) {
    (root || document).querySelectorAll('.photo[data-src]').forEach(function (box) {
      var alt = photoAlt(box) || '';
      var state = box.getAttribute('data-state');
      if (state === 'loaded') { box.querySelector('img').alt = alt; return; }
      if (state === 'missing') { placeholder(box, alt); return; }
      if (state === 'loading') return;
      box.setAttribute('data-state', 'loading');
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        box.setAttribute('data-state', 'loaded');
        box.removeAttribute('role'); box.removeAttribute('aria-label');
        img.alt = photoAlt(box) || '';
        box.innerHTML = ''; box.appendChild(img);
      };
      img.onerror = function () {
        box.setAttribute('data-state', 'missing');
        placeholder(box, photoAlt(box) || '');
      };
      img.src = box.getAttribute('data-src');
    });
  }

  function placeholder(box, alt) {
    var file = box.getAttribute('data-src').split('/').pop();
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', alt + ' (' + t('photo_soon') + ')');
    box.innerHTML = '<span class="ph" aria-hidden="true">' + CAMERA +
      '<span class="ph-alt">' + esc(alt) + '</span><span class="ph-file">' + esc(file) + '</span></span>';
  }

  /* ---------- Activités ---------- */
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function currentCat() {
    var sel = document.getElementById('cat-filter');
    return sel ? sel.value : '';
  }
  function upcoming(cat) {
    var today = todayISO();
    return (content.activities || [])
      .filter(function (a) { return a.date >= today && (!cat || a.category === cat); })
      .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
  }

  function activityItem(a, hl) {
    var d = toDate(a.date);
    return '<li class="event" id="act-' + esc(a.id) + '">' +
      '<p class="event-date" aria-hidden="true"><span class="ed-day">' + d.getDate() + '</span>' +
        '<span class="ed-month">' + esc(fmtDate(a.date, { month: 'short' }).replace('.', '')) + '</span></p>' +
      '<div class="event-body">' +
        '<p class="tag tag-' + esc(a.category) + '">' + esc(t('cat_' + a.category)) + '</p>' +
        '<h' + hl + ' class="event-title">' + esc(L(a.title)) + '</h' + hl + '>' +
        '<p class="event-meta"><span class="sr-only">' + esc(t('when')) + ' </span>' +
          '<time datetime="' + esc(a.date + 'T' + a.time) + '">' +
          esc(fmtDate(a.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + ', ' + esc(fmtTime(a.time)) + '</time>' +
          '<br><span class="sr-only">' + esc(t('where')) + ' </span>' + esc(L(a.place)) + '</p>' +
        '<p class="event-desc">' + esc(L(a.desc)) + '</p>' +
      '</div></li>';
  }

  function renderUpcoming(el) {
    var count = el.getAttribute('data-count');
    var hl = el.getAttribute('data-heading') || '3';
    var cat = el.hasAttribute('data-filter') ? currentCat() : '';
    var list = upcoming(cat);
    if (count && count !== 'all') list = list.slice(0, parseInt(count, 10));
    el.innerHTML = list.length
      ? '<ul class="events' + (el.getAttribute('data-layout') === 'row' ? ' events-row' : '') + '" role="list">' + list.map(function (a) { return activityItem(a, hl); }).join('') + '</ul>'
      : '<p class="empty">' + esc(cat ? t('no_upcoming_filter') : t('no_upcoming')) + '</p>';
  }

  /* ---------- Calendrier (tableau accessible) ---------- */
  var calMonth = null;

  function renderCalendar(el) {
    if (!calMonth) { var n = new Date(); calMonth = new Date(n.getFullYear(), n.getMonth(), 1); }
    var y = calMonth.getFullYear(), m = calMonth.getMonth();
    var monthLabel = new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(calMonth);
    var monthName = new Intl.DateTimeFormat(locale(), { month: 'long' }).format(calMonth);
    var cat = currentCat();
    var today = todayISO();
    var byDay = {}, total = 0;
    (content.activities || []).forEach(function (a) {
      if (cat && a.category !== cat) return;
      var p = a.date.split('-').map(Number);
      if (p[0] === y && p[1] - 1 === m) { (byDay[p[2]] = byDay[p[2]] || []).push(a); total++; }
    });

    var head = '';
    for (var i = 0; i < 7; i++) {
      var wd = new Date(2024, 0, 1 + i); // 1er janvier 2024 = lundi
      head += '<th scope="col" abbr="' + esc(new Intl.DateTimeFormat(locale(), { weekday: 'long' }).format(wd)) + '">' +
        esc(new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(wd).replace('.', '')) + '</th>';
    }

    var first = (new Date(y, m, 1).getDay() + 6) % 7;
    var days = new Date(y, m + 1, 0).getDate();
    var rows = '', cells = [];
    for (i = 0; i < first; i++) cells.push('<td class="cal-empty"></td>');
    for (var d = 1; d <= days; d++) {
      var iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var evs = (byDay[d] || []).sort(function (a, b) { return a.time.localeCompare(b.time); });
      var items = evs.map(function (a) {
        var label = esc(fmtTime(a.time)) + ' ' + esc(L(a.title));
        var inner = '<span class="cal-dot tag-' + esc(a.category) + '" aria-hidden="true"></span><span class="cal-ev-text">' + label + '</span>';
        return '<li>' + (a.date >= today
          ? '<a class="cal-ev" href="#act-' + esc(a.id) + '">' + inner + '</a>'
          : '<span class="cal-ev is-past">' + inner + '</span>') + '</li>';
      }).join('');
      cells.push('<td class="' + (evs.length ? 'has-ev' : '') + (iso === today ? ' is-today' : '') + '">' +
        '<span class="cal-num">' + d + '<span class="sr-only"> ' + esc(monthName) + (iso === today ? ', ' + esc(t('cal_today')) : '') + '</span></span>' +
        (items ? '<ul role="list">' + items + '</ul>' : '') + '</td>');
    }
    while (cells.length % 7) cells.push('<td class="cal-empty"></td>');
    for (i = 0; i < cells.length; i += 7) rows += '<tr>' + cells.slice(i, i + 7).join('') + '</tr>';

    var summary = total === 0 ? t('cal_none') : (total === 1 ? t('cal_count_one') : t('cal_count').replace('{n}', total));

    el.innerHTML =
      '<div class="cal-head">' +
        '<button type="button" class="btn btn-quiet" data-cal="-1"><span aria-hidden="true">‹</span> ' + esc(t('cal_prev')) + '</button>' +
        '<h3 id="cal-title" class="cal-title">' + esc(monthLabel) + '</h3>' +
        '<button type="button" class="btn btn-quiet" data-cal="1">' + esc(t('cal_next')) + ' <span aria-hidden="true">›</span></button>' +
      '</div>' +
      '<p class="cal-summary" id="cal-summary">' + esc(summary) + '</p>' +
      '<div class="cal-scroll"><table class="cal" aria-labelledby="cal-title" aria-describedby="cal-summary">' +
        '<thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>';

    el.querySelectorAll('[data-cal]').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.getAttribute('data-cal'), 10);
        calMonth = new Date(y, m + dir, 1);
        renderCalendar(el);
        el.querySelector('[data-cal="' + dir + '"]').focus();
        announce(el.querySelector('#cal-title').textContent + '. ' + el.querySelector('#cal-summary').textContent);
      });
    });
  }

  /* ---------- Nouvelles, initiatives, équipe, partenaires ---------- */
  function renderNews(el) {
    var count = el.getAttribute('data-count');
    var hl = el.getAttribute('data-heading') || '3';
    var list = (content.news || []).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    if (count && count !== 'all') list = list.slice(0, parseInt(count, 10));
    el.innerHTML = '<ul class="news" role="list">' + list.map(function (n) {
      return '<li class="news-item"><article>' +
        '<p class="news-date"><time datetime="' + esc(n.date) + '">' + esc(fmtDate(n.date, { day: 'numeric', month: 'long', year: 'numeric' })) + '</time></p>' +
        '<h' + hl + ' class="news-title">' + esc(L(n.title)) + '</h' + hl + '>' +
        '<p>' + esc(L(n.summary)) + '</p>' +
        (L(n.body) ? '<details><summary>' + esc(t('read_more')) + '<span class="sr-only"> : ' + esc(L(n.title)) + '</span></summary><p>' + esc(L(n.body)) + '</p></details>' : '') +
        '</article></li>';
    }).join('') + '</ul>';
  }

  var SHAPES = ['shape-arch', 'shape-round', 'shape-pill', 'shape-leaf'];

  function renderInitiatives(el) {
    el.innerHTML = '<ul class="initiatives" role="list">' + (content.initiatives || []).map(function (it, i) {
      return '<li class="initiative">' +
        '<div class="photo ' + SHAPES[i % SHAPES.length] + '" data-src="' + esc(it.photo) + '" data-alt="' + esc(it.title.fr) + '" data-alt-en="' + esc(it.title.en) + '"></div>' +
        '<div class="initiative-body"><p class="initiative-year">' + esc(it.year) + '</p>' +
        '<h2>' + esc(L(it.title)) + '</h2><p>' + esc(L(it.desc)) + '</p>' +
        '<p class="initiative-impact"><strong>' + esc(t('impact')) + '</strong> ' + esc(L(it.impact)) + '</p></div></li>';
    }).join('') + '</ul>';
    renderPhotos(el);
  }

  var AVATAR_COLORS = ['var(--blue)', 'var(--green)', 'var(--sun)', 'var(--rose)'];
  function initials(name) { return name.split(/\s+/).map(function (p) { return p.charAt(0); }).slice(0, 2).join(''); }

  function renderTeam(el) {
    var which = el.getAttribute('data-render') === 'team' ? content.team : content.volunteers;
    var isStaff = el.getAttribute('data-render') === 'team';
    el.innerHTML = '<ul class="people' + (isStaff ? '' : ' people-compact') + '" role="list">' + (which || []).map(function (p, i) {
      return '<li class="person"><span class="avatar" style="--c:' + AVATAR_COLORS[i % 4] + '" aria-hidden="true">' + esc(initials(p.name)) + '</span>' +
        '<div><h3 class="person-name">' + esc(p.name) + '</h3><p class="person-role">' + esc(L(p.role)) + '</p>' +
        (p.langs ? '<p class="person-langs"><span>' + esc(t('langs_spoken')) + '</span> ' + esc(p.langs) + '</p>' : '') +
        '</div></li>';
    }).join('') + '</ul>';
  }

  function renderPartners(el) {
    el.innerHTML = '<ul class="partners" role="list">' + (content.partners || []).map(function (p) {
      return '<li class="partner"><h3>' + esc(p.name) + '</h3><p>' + esc(L(p.desc)) + '</p></li>';
    }).join('') + '</ul>';
  }

  function renderSponsors(el) {
    var tiers = ['or', 'argent', 'ami'];
    el.innerHTML = tiers.map(function (tier) {
      var list = (content.sponsors || []).filter(function (s) { return s.tier === tier; });
      if (!list.length) return '';
      return '<div class="tier tier-' + tier + '"><h3>' + esc(t('tier_' + tier)) + '</h3><ul role="list">' +
        list.map(function (s) { return '<li class="sponsor"><span class="sponsor-logo" aria-hidden="true">' + esc(initials(s.name)) + '</span>' + esc(s.name) + '</li>'; }).join('') +
        '</ul></div>';
    }).join('');
  }

  function renderOrg(el) {
    var org = content.org || {};
    var hours = (org.hours || []).map(function (h) {
      return '<tr><th scope="row">' + esc(L(h.days)) + '</th><td>' + esc(L(h.time)) + '</td></tr>';
    }).join('');
    el.innerHTML =
      '<dl class="coords">' +
        '<div><dt>' + (lang === 'en' ? 'Address' : 'Adresse') + '</dt><dd><address>945, ch. de Chambly<br>Longueuil (Québec) J4H 4A9</address></dd></div>' +
        '<div><dt>' + (lang === 'en' ? 'Phone' : 'Téléphone') + '</dt><dd><a href="tel:' + esc((org.phone || '').replace(/\D/g, '')) + '">' + esc(org.phone) + '</a></dd></div>' +
        '<div><dt>' + (lang === 'en' ? 'Email' : 'Courriel') + '</dt><dd><a href="mailto:' + esc(org.email) + '">' + esc(org.email) + '</a></dd></div>' +
      '</dl>' +
      '<table class="hours-table"><caption>' + esc(t('footer_hours')) + '</caption><tbody>' + hours + '</tbody></table>';
  }

  var RENDERERS = {
    upcoming: renderUpcoming,
    calendar: renderCalendar,
    news: renderNews,
    initiatives: renderInitiatives,
    team: renderTeam,
    volunteers: renderTeam,
    partners: renderPartners,
    sponsors: renderSponsors,
    org: renderOrg
  };

  function renderAll() {
    document.querySelectorAll('[data-render]').forEach(function (el) {
      var fn = RENDERERS[el.getAttribute('data-render')];
      if (fn) fn(el);
    });
    renderPhotos();
    var sel = document.getElementById('cat-filter');
    if (sel) {
      var v = sel.value;
      sel.innerHTML = ['', 'benevolat', 'entraide', 'evenement', 'atelier', 'sensibilisation'].map(function (c) {
        return '<option value="' + c + '">' + esc(c ? t('cat_' + c) : t('cat_all')) + '</option>';
      }).join('');
      sel.value = v;
    }
  }

  /* ---------- Formulaires (prototype : aucune donnée n'est envoyée) ---------- */
  function setError(field, msg) {
    var id = field.id + '-err';
    var e = document.getElementById(id);
    if (!e) {
      e = document.createElement('p');
      e.id = id; e.className = 'field-error';
      var holder = field.closest('.field') || field.parentNode;
      holder.appendChild(e);
    }
    e.textContent = msg;
    field.setAttribute('aria-invalid', 'true');
    var db = (field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (db.indexOf(id) < 0) { db.push(id); field.setAttribute('aria-describedby', db.join(' ')); }
  }
  function clearError(field) {
    field.removeAttribute('aria-invalid');
    var e = document.getElementById(field.id + '-err');
    if (e) e.textContent = '';
  }

  function setupForms() {
    document.querySelectorAll('form[data-proto]').forEach(function (form) {
      form.setAttribute('novalidate', '');
      form.addEventListener('input', function (e) { if (e.target.id) clearError(e.target); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var status = form.querySelector('.form-status');
        var bad = [];
        form.querySelectorAll('input, select, textarea').forEach(function (f) {
          if (!f.id || f.disabled || f.closest('[hidden]')) return;
          clearError(f);
          if (f.validity.valid) return;
          var msg = t('err_required');
          if (f.validity.typeMismatch && f.type === 'email') msg = t('err_email');
          else if (f.validity.badInput || f.validity.rangeUnderflow || f.validity.rangeOverflow) msg = t('err_number');
          setError(f, msg);
          bad.push(f);
        });
        if (bad.length) {
          status.className = 'form-status is-error';
          status.textContent = t('err_summary').replace('{n}', bad.length);
          bad[0].focus();
          return;
        }
        status.className = 'form-status is-success';
        status.textContent = form.getAttribute(lang === 'en' ? 'data-success-en' : 'data-success');
        form.reset();
        toggleOtherAmount();
        status.focus();
      });
    });
  }

  /* Don : afficher le champ « autre montant » au besoin */
  function toggleOtherAmount() {
    var other = document.getElementById('amount-other');
    var wrap = document.getElementById('other-wrap');
    if (!other || !wrap) return;
    wrap.hidden = !other.checked;
  }
  function setupDonation() {
    document.querySelectorAll('input[name="amount"]').forEach(function (r) {
      r.addEventListener('change', toggleOtherAmount);
    });
    toggleOtherAmount();
  }

  /* ---------- Démarrage ---------- */
  window.CEA = {
    loadContent: loadContent, saveContent: saveContent, resetContent: resetContent,
    esc: esc, defaults: function () { return clone(window.DEFAULT_CONTENT); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyA11y();
    if (document.body.getAttribute('data-page') === 'admin') return; // l'espace employés est en français
    buildHeader();
    buildFooter();
    applyLang();
    renderAll();
    setupForms();
    setupDonation();
    var sel = document.getElementById('cat-filter');
    if (sel) sel.addEventListener('change', function () {
      document.querySelectorAll('[data-render="calendar"], [data-render="upcoming"][data-filter]').forEach(function (el) {
        RENDERERS[el.getAttribute('data-render')](el);
      });
    });
  });
})();
