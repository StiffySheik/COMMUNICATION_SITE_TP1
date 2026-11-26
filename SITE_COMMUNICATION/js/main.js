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

  // Complète un contenu (ancien ou importé) avec les zones ajoutées par l'éditeur visuel
  function normalize(c) {
    function both() { return { fr: {}, en: {} }; }
    c.texts = c.texts || both();
    c.texts.fr = c.texts.fr || {}; c.texts.en = c.texts.en || {};
    c.overrides = c.overrides || both();
    c.strings = c.strings || both();
    c.links = c.links || {};
    c.photos = c.photos || {};
    c.hidden = c.hidden || {};
    c.blocks = c.blocks || [];
    c.org = c.org || {};
    c.org.hours = c.org.hours || [];
    ['activities', 'news', 'initiatives', 'team', 'volunteers', 'partners', 'sponsors'].forEach(function (k) {
      c[k] = c[k] || [];
      c[k].forEach(function (it, i) { if (!it.id) it.id = k.charAt(0) + 'x' + i; });
    });
    return c;
  }

  function loadContent() {
    var s = storageGet(STORE_KEY);
    if (s) {
      try {
        var c = JSON.parse(s);
        if (c && c.version === window.DEFAULT_CONTENT.version) return normalize(c);
      } catch (e) { /* contenu corrompu : on revient au défaut */ }
    }
    return normalize(clone(window.DEFAULT_CONTENT));
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
    var custom = content.strings && content.strings[lang] && content.strings[lang][key];
    if (custom) return custom;
    var d = window.I18N[lang] || {};
    return d[key] != null ? d[key] : (window.I18N.fr[key] != null ? window.I18N.fr[key] : key);
  }
  // Texte d'interface modifiable par les employés (en-tête, pied de page)
  function ti(key) { return '<span data-i18n="' + key + '">' + esc(t(key)) + '</span>'; }
  // Texte saisi par un employé : échappé, sauts de ligne conservés
  function fmtText(s) { return esc(s).replace(/\n/g, '<br>'); }
  // Liens saisis par un employé : seulement web, courriel, téléphone ou pages du site
  function safeHref(h) {
    h = String(h || '').trim();
    if (!h) return '';
    if (/^(https?:|mailto:|tel:)/i.test(h)) return h;
    if (/^[a-z][a-z0-9+.-]*:/i.test(h) || /^\/\//.test(h)) return '';
    return h;
  }
  function paragraphs(s) {
    return String(s || '').split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p) { return '<p>' + fmtText(p.trim()) + '</p>'; }).join('');
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

  /* ---------- Lecture à voix haute (synthèse vocale du navigateur) ---------- */
  var SPEAKER = '<svg class="tool-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.5-1.5a6 6 0 0 1 0 9M19 5a9.5 9.5 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TTS_RATE_KEY = 'cea-tts-rate';
  var tts = { active: false, paused: false, queue: [], i: 0, token: 0, current: null, el: null, selection: false,
              rate: parseFloat(storageGet(TTS_RATE_KEY)) || 1 };
  var READABLE = 'h1, h2, h3, h4, p, li, dt, dd, th, td, legend, summary, address, blockquote';

  function ttsSupported() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }

  function pickVoice(l) {
    var voices = window.speechSynthesis.getVoices() || [];
    var base = (l || 'fr').toLowerCase().split('-')[0];
    var prefs = base === 'fr' ? ['fr-ca', 'fr-fr', 'fr'] : base === 'en' ? ['en-ca', 'en-us', 'en-gb', 'en'] : [base];
    for (var p = 0; p < prefs.length; p++) {
      for (var v = 0; v < voices.length; v++) {
        if (voices[v].lang.replace('_', '-').toLowerCase().indexOf(prefs[p]) === 0) return voices[v];
      }
    }
    return null;
  }

  // Coupe un long texte en phrases (certains navigateurs s'arrêtent sur les textes trop longs)
  function chunks(text) {
    var parts = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?…:;])\s+/);
    var out = [], buf = '';
    parts.forEach(function (s) {
      if (buf && (buf + ' ' + s).length > 220) { out.push(buf); buf = s; }
      else buf = buf ? buf + ' ' + s : s;
    });
    if (buf) out.push(buf);
    return out;
  }

  function collectPage() {
    var root = document.getElementById('contenu');
    var q = [];
    root.querySelectorAll(READABLE).forEach(function (el) {
      // ignore : formulaires, calendrier visuel (la liste en dessous dit la même chose), photos, éléments cachés
      if (el.closest('form, .cal-scroll, [aria-hidden="true"], .photo, [hidden], .cea-ui')) return;
      if (!el.getClientRects().length) return;
      if (el.querySelector(READABLE)) return; // on lit les éléments les plus précis, sans doublon
      var text = (el.innerText || '').trim();
      if (!text) return;
      var l = (el.closest('[lang]') || document.documentElement).getAttribute('lang');
      chunks(text).forEach(function (c) { q.push({ el: el, text: c, lang: l }); });
    });
    return q;
  }

  function highlight(el) {
    if (tts.el && tts.el !== el) tts.el.classList.remove('tts-current');
    tts.el = el;
    if (!el) return;
    el.classList.add('tts-current');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var r = el.getBoundingClientRect();
    var hdr = document.getElementById('site-header');
    var top = hdr ? hdr.getBoundingClientRect().bottom + 10 : 10;
    if (r.top < top || r.bottom > window.innerHeight - 40) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }

  function setStatus() {
    var s = document.getElementById('tts-status');
    if (!s) return;
    s.textContent = tts.selection ? t('tts_selection')
      : t('tts_progress').replace('{i}', Math.min(tts.i + 1, tts.queue.length)).replace('{n}', tts.queue.length);
  }

  function speakNext() {
    var my = tts.token;
    if (tts.i >= tts.queue.length) { ttsStop(true); announce(t('tts_done')); return; }
    var item = tts.queue[tts.i];
    highlight(item.el);
    setStatus();
    var u = new SpeechSynthesisUtterance(item.text);
    u.lang = item.lang === 'fr' ? 'fr-CA' : item.lang === 'en' ? 'en-CA' : item.lang;
    var voice = pickVoice(item.lang);
    if (voice) u.voice = voice;
    u.rate = tts.rate;
    u.onend = function () { if (my !== tts.token) return; tts.i++; speakNext(); };
    u.onerror = function (e) {
      if (my !== tts.token || e.error === 'interrupted' || e.error === 'canceled') return;
      tts.i++; speakNext();
    };
    tts.current = u; // garde une référence (évite un bogue de Chrome)
    window.speechSynthesis.speak(u);
  }

  function ttsStart(selectedText) {
    window.speechSynthesis.cancel();
    tts.token++;
    tts.selection = !!selectedText;
    tts.queue = selectedText
      ? chunks(selectedText).map(function (c) { return { el: null, text: c, lang: lang }; })
      : collectPage();
    tts.i = 0; tts.active = true; tts.paused = false;
    var bar = document.getElementById('tts-bar');
    bar.hidden = false;
    document.getElementById('btn-tts').setAttribute('aria-pressed', 'true');
    document.getElementById('tts-pause').textContent = t('tts_pause');
    announce(tts.selection ? t('tts_selection') : t('tts_started'));
    speakNext();
  }

  function ttsStop(restoreFocus) {
    if (!ttsSupported()) return;
    tts.token++;
    window.speechSynthesis.cancel();
    highlight(null);
    tts.active = false; tts.paused = false; tts.queue = []; tts.i = 0;
    var bar = document.getElementById('tts-bar');
    if (bar) bar.hidden = true;
    var btn = document.getElementById('btn-tts');
    if (btn) { btn.setAttribute('aria-pressed', 'false'); if (restoreFocus) btn.focus(); }
  }

  // Pause fiable sur tous les navigateurs : on arrête et on reprend au même passage
  function ttsTogglePause() {
    var b = document.getElementById('tts-pause');
    if (tts.paused) {
      tts.paused = false; b.textContent = t('tts_pause');
      speakNext();
    } else {
      tts.paused = true; tts.token++;
      window.speechSynthesis.cancel();
      b.textContent = t('tts_resume');
    }
  }

  function setupTTS() {
    var btn = document.getElementById('btn-tts');
    if (!btn) return;
    // garder la sélection de texte quand on clique sur le bouton
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    btn.addEventListener('click', function () {
      if (tts.active) { ttsStop(true); return; }
      var sel = window.getSelection ? window.getSelection() : null;
      var main = document.getElementById('contenu');
      var text = sel && sel.rangeCount && main && main.contains(sel.anchorNode) ? sel.toString().trim() : '';
      ttsStart(text);
    });
    document.getElementById('tts-pause').addEventListener('click', ttsTogglePause);
    document.getElementById('tts-stop').addEventListener('click', function () { ttsStop(true); });
    document.getElementById('tts-rate').addEventListener('change', function () {
      tts.rate = parseFloat(this.value) || 1;
      storageSet(TTS_RATE_KEY, String(tts.rate));
      if (tts.active && !tts.paused) { tts.token++; window.speechSynthesis.cancel(); speakNext(); }
    });
  }

  if (ttsSupported()) {
    window.speechSynthesis.cancel(); // arrête une lecture laissée par la page précédente
    window.speechSynthesis.onvoiceschanged = function () {};
    window.addEventListener('pagehide', function () { window.speechSynthesis.cancel(); });
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

  var LOCK = '<svg class="tool-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  var PENCIL = '<svg class="tool-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';

  function sessionGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function staffButton() {
    var logged = sessionGet('cea-admin-session') === '1';
    var editing = logged && sessionGet('cea-edit') === '1';
    if (!logged) return '<button type="button" class="tool tool-staff" id="btn-staff" aria-haspopup="dialog">' + LOCK + esc(t('staff_login')) + '</button>';
    return '<button type="button" class="tool tool-staff is-logged" id="btn-staff" aria-pressed="' + editing + '">' + PENCIL + esc(t('staff_edit')) + '</button>';
  }

  function buildHeader() {
    var h = document.getElementById('site-header');
    if (!h) return;
    var page = document.body.getAttribute('data-page');
    var navItems = NAV.map(function (n) {
      return '<li><a href="' + n[1] + '"' + (n[0] === page ? ' aria-current="page"' : '') + '>' + ti(n[2]) + '</a></li>';
    }).join('');
    var org = content.org || {};
    h.innerHTML =
      '<div class="topbar"><div class="wrap topbar-inner">' +
        '<p class="topbar-contact"><a href="tel:' + esc((org.phone || '').replace(/\D/g, '')) + '">' + esc(org.phone) + '</a>' +
        '<a href="mailto:' + esc(org.email) + '">' + esc(org.email) + '</a></p>' +
        '<div class="tools" role="group" aria-label="' + esc(t('a11y_tools')) + '">' +
          '<button type="button" class="tool" id="btn-text" aria-pressed="' + !!a11y.big + '"><span aria-hidden="true" class="tool-ico">A+</span>' + esc(t('text_size')) + '</button>' +
          '<button type="button" class="tool" id="btn-contrast" aria-pressed="' + !!a11y.hc + '"><span aria-hidden="true" class="tool-ico tool-ico-contrast"></span>' + esc(t('contrast')) + '</button>' +
          (ttsSupported() ? '<button type="button" class="tool" id="btn-tts" aria-pressed="' + tts.active + '" aria-controls="tts-bar">' + SPEAKER + esc(t('tts_listen')) + '</button>' : '') +
          '<button type="button" class="tool tool-lang" id="btn-lang" lang="' + t('lang_switch_code') + '">' + esc(t('lang_switch')) + '</button>' +
          staffButton() +
        '</div>' +
      '</div></div>' +
      '<div class="wrap navbar">' +
        '<a class="brand" href="index.html">' + LOGO + '<span class="brand-name">' + ti('site_name') + '</span></a>' +
        '<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="main-nav">' +
          '<span class="menu-bars" aria-hidden="true"><span></span><span></span><span></span></span>' +
          '<span class="menu-label">' + esc(t('menu')) + '</span></button>' +
        '<nav id="main-nav" class="main-nav" aria-label="' + esc(t('nav_label')) + '">' +
          '<ul>' + navItems + '</ul>' +
          '<a class="btn btn-donate" href="don.html"' + (page === 'donate' ? ' aria-current="page"' : '') + '>' + ti('nav_donate') + '</a>' +
        '</nav>' +
      '</div>' +
      (ttsSupported() ?
      '<div id="tts-bar" class="tts-bar" role="region" aria-label="' + esc(t('tts_bar')) + '" hidden><div class="wrap tts-inner">' +
        '<p class="tts-status" id="tts-status"></p>' +
        '<div class="tts-controls">' +
          '<button type="button" class="btn btn-quiet" id="tts-pause">' + esc(t('tts_pause')) + '</button>' +
          '<button type="button" class="btn btn-quiet" id="tts-stop">' + esc(t('tts_stop')) + '</button>' +
          '<label class="tts-speed" for="tts-rate">' + esc(t('tts_speed')) + '</label>' +
          '<select id="tts-rate">' + [0.75, 1, 1.25, 1.5].map(function (r) {
            return '<option value="' + r + '"' + (r === tts.rate ? ' selected' : '') + '>' + String(r).replace('.', lang === 'fr' ? ',' : '.') + ' ×</option>';
          }).join('') + '</select>' +
        '</div>' +
        '<p class="tts-tip">' + esc(t('tts_tip')) + '</p>' +
      '</div></div>' : '');
    setupTTS();

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
  }

  // Un seul écouteur, même si l'en-tête est redessiné
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (tts.active) { ttsStop(true); return; }
    var nav = document.querySelector('#site-header .main-nav');
    var toggle = document.querySelector('#site-header .menu-toggle');
    if (nav && toggle && nav.classList.contains('is-open')) { toggle.click(); toggle.focus(); }
  });

  function buildFooter() {
    var f = document.getElementById('site-footer');
    if (!f) return;
    var org = content.org || {};
    var hours = (org.hours || []).map(function (h) {
      return '<div><dt>' + esc(L(h.days)) + '</dt><dd>' + esc(L(h.time)) + '</dd></div>';
    }).join('');
    f.innerHTML =
      '<div class="wrap footer-grid">' +
        '<div class="footer-brand"><p class="footer-name">' + LOGO + ti('site_name') + '</p><p>' + ti('footer_tagline') + '</p>' +
          '<p><a class="footer-link-strong" href="nouvelles.html#infolettre">' + ti('footer_newsletter') + '</a></p></div>' +
        '<div><h2>' + ti('footer_visit') + '</h2><address>' + addressHtml(org) + '</address>' +
          '<p><a href="contact.html#plan">' + ti('footer_map') + '</a></p></div>' +
        '<div><h2>' + ti('footer_hours') + '</h2><dl class="hours">' + hours + '</dl></div>' +
        '<div><h2>' + ti('footer_contact') + '</h2><p><a href="tel:' + esc((org.phone || '').replace(/\D/g, '')) + '">' + esc(org.phone) + '</a><br>' +
          '<a href="mailto:' + esc(org.email) + '">' + esc(org.email) + '</a></p></div>' +
      '</div>' +
      '<div class="wrap footer-bottom"><p>© 2026 ' + esc(t('site_name')) + '. ' + ti('footer_rights') + '</p>' +
        '<p><a href="admin.html">' + ti('footer_admin') + '</a></p></div>';
  }

  // « 945, ch. de Chambly, Longueuil (Québec) J4H 4A9 » → 2 lignes
  function addressHtml(org) {
    var a = org.address || '';
    var i = a.indexOf(', ', a.indexOf(',') + 1);
    return i > 0 ? esc(a.slice(0, i)) + '<br>' + esc(a.slice(i + 2)) : esc(a);
  }

  /* ---------- Traduction des textes de page ---------- */
  var ATTRS = ['placeholder', 'aria-label', 'content', 'title', 'alt'];

  // Donne à chaque texte de la page une clé stable (page#rang) pour enregistrer les modifications
  var PAGE = document.body ? document.body.getAttribute('data-page') : '';
  function keyTexts() {
    var i = 0;
    document.querySelectorAll('body [data-en]').forEach(function (el) {
      if (!el.hasAttribute('data-ek') && !el.closest('#site-header, #site-footer')) el.setAttribute('data-ek', PAGE + '#' + (i++));
    });
  }

  function applyLang() {
    document.documentElement.lang = lang;
    var texts = (content.texts && content.texts[lang]) || {};
    var over = (content.overrides && content.overrides[lang]) || {};

    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (el.getAttribute('data-fr') === null) el.setAttribute('data-fr', el.innerHTML);
      var key = el.getAttribute('data-key');
      var ek = el.getAttribute('data-ek');
      if (key && texts[key]) el.innerHTML = fmtText(texts[key]);
      else if (ek && over[ek] != null) el.innerHTML = fmtText(over[ek]);
      else el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-fr');
      var a = ek && (el.tagName === 'A' ? el : el.closest('a'));
      if (a) {
        if (!a.hasAttribute('data-href-orig')) a.setAttribute('data-href-orig', a.getAttribute('href') || '');
        a.setAttribute('href', safeHref(content.links[ek]) || a.getAttribute('data-href-orig'));
      }
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
      if (p) { p.setAttribute('data-key', 'announcement'); p.innerHTML = fmtText(msg || ''); }
    }
  }

  function setLang(l) {
    ttsStop(false);
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

  function photoOverride(box) { return (content.photos || {})[box.getAttribute('data-src')] || {}; }
  function photoAlt(box) {
    var o = photoOverride(box).alt || {};
    if (o[lang]) return o[lang];
    return lang === 'en' ? (box.getAttribute('data-alt-en') || box.getAttribute('data-alt')) : box.getAttribute('data-alt');
  }
  function photoUrl(box) { return photoOverride(box).url || box.getAttribute('data-src'); }

  function renderPhotos(root) {
    (root || document).querySelectorAll('.photo[data-src]').forEach(function (box) {
      var alt = photoAlt(box) || '';
      var state = box.getAttribute('data-state');
      var url = photoUrl(box);
      if (state && box.getAttribute('data-url') !== url) state = null; // photo remplacée : on recharge
      if (state === 'loaded') { box.querySelector('img').alt = alt; return; }
      if (state === 'missing') { placeholder(box, alt); return; }
      if (state === 'loading') return;
      box.setAttribute('data-state', 'loading');
      box.setAttribute('data-url', url);
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        if (box.getAttribute('data-url') !== url) return; // une autre photo a été choisie entre-temps
        box.setAttribute('data-state', 'loaded');
        box.removeAttribute('role'); box.removeAttribute('aria-label');
        img.alt = photoAlt(box) || '';
        box.innerHTML = ''; box.appendChild(img);
        if (window.CEA.onPhoto) window.CEA.onPhoto(box);
      };
      img.onerror = function () {
        if (box.getAttribute('data-url') !== url) return;
        box.setAttribute('data-state', 'missing');
        placeholder(box, photoAlt(box) || '');
        if (window.CEA.onPhoto) window.CEA.onPhoto(box);
      };
      img.src = url;
    });
  }

  function placeholder(box, alt) {
    var file = box.getAttribute('data-src').split('/').pop();
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', alt + ' (' + t('photo_soon') + ')');
    box.innerHTML = '<span class="ph" aria-hidden="true">' + CAMERA +
      '<span class="ph-alt">' + esc(alt) + '</span><span class="ph-file">' + esc(file) + '</span></span>';
  }

  // Repère un élément de liste pour l'éditeur visuel
  function itemAttrs(coll, it) { return ' data-coll="' + coll + '" data-id="' + esc(it.id) + '"'; }

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
    return '<li class="event" id="act-' + esc(a.id) + '"' + itemAttrs('activities', a) + '>' +
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
      return '<li class="news-item"' + itemAttrs('news', n) + '><article>' +
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
      return '<li class="initiative"' + itemAttrs('initiatives', it) + '>' +
        '<div class="photo ' + SHAPES[i % SHAPES.length] + '" data-src="' + esc(it.photo || 'images/initiative-' + it.id + '.jpg') + '" data-alt="' + esc((it.title || {}).fr) + '" data-alt-en="' + esc((it.title || {}).en) + '"></div>' +
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
      return '<li class="person"' + itemAttrs(isStaff ? 'team' : 'volunteers', p) + '><span class="avatar" style="--c:' + AVATAR_COLORS[i % 4] + '" aria-hidden="true">' + esc(initials(p.name)) + '</span>' +
        '<div><h3 class="person-name">' + esc(p.name) + '</h3><p class="person-role">' + esc(L(p.role)) + '</p>' +
        (p.langs ? '<p class="person-langs"><span>' + esc(t('langs_spoken')) + '</span> ' + esc(p.langs) + '</p>' : '') +
        '</div></li>';
    }).join('') + '</ul>';
  }

  function renderPartners(el) {
    el.innerHTML = '<ul class="partners" role="list">' + (content.partners || []).map(function (p) {
      return '<li class="partner"' + itemAttrs('partners', p) + '><h3>' + esc(p.name) + '</h3><p>' + esc(L(p.desc)) + '</p></li>';
    }).join('') + '</ul>';
  }

  function renderSponsors(el) {
    var tiers = ['or', 'argent', 'ami'];
    el.innerHTML = tiers.map(function (tier) {
      var list = (content.sponsors || []).filter(function (s) { return s.tier === tier; });
      if (!list.length) return '';
      return '<div class="tier tier-' + tier + '"><h3>' + esc(t('tier_' + tier)) + '</h3><ul role="list">' +
        list.map(function (s) { return '<li class="sponsor"' + itemAttrs('sponsors', s) + '><span class="sponsor-logo" aria-hidden="true">' + esc(initials(s.name)) + '</span>' + esc(s.name) + '</li>'; }).join('') +
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
        '<div><dt>' + (lang === 'en' ? 'Address' : 'Adresse') + '</dt><dd><address>' + addressHtml(org) + '</address></dd></div>' +
        '<div><dt>' + (lang === 'en' ? 'Phone' : 'Téléphone') + '</dt><dd><a href="tel:' + esc((org.phone || '').replace(/\D/g, '')) + '">' + esc(org.phone) + '</a></dd></div>' +
        '<div><dt>' + (lang === 'en' ? 'Email' : 'Courriel') + '</dt><dd><a href="mailto:' + esc(org.email) + '">' + esc(org.email) + '</a></dd></div>' +
      '</dl>' +
      '<table class="hours-table"><caption>' + esc(t('footer_hours')) + '</caption><tbody>' + hours + '</tbody></table>';
  }

  /* ---------- Blocs ajoutés par les employés et sections masquées ---------- */
  function safeImg(u) {
    u = String(u || '').trim();
    if (/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(u)) return u;
    return safeHref(u);
  }
  var BLOCK_BG = { white: 'section-white', ink: 'section-ink', sun: 'block-sun', soft: '' };

  function blockButton(b) {
    var label = L(b.btn), href = safeHref(b.href);
    if (!label || !href) return '';
    return '<p class="block-btn"><a class="btn' + (b.bg === 'ink' ? ' btn-sun' : b.bg === 'sun' ? ' btn-ink' : '') + '" href="' + esc(href) + '">' + esc(label) + '</a></p>';
  }

  function blockHtml(b) {
    var tid = 'blk-' + esc(b.id) + '-t';
    var title = L(b.title) ? '<h2 id="' + tid + '">' + fmtText(L(b.title)) + '</h2>' : '';
    var body = paragraphs(L(b.body));
    var inner;
    if (b.type === 'imagetext') {
      inner = '<div class="wrap block-split' + (b.side === 'right' ? ' img-right' : '') + '">' +
        '<div class="photo shape-soft block-photo" data-src="' + esc(safeImg(b.img)) + '" data-alt="' + esc((b.alt || {}).fr) + '" data-alt-en="' + esc((b.alt || {}).en) + '"></div>' +
        '<div>' + title + body + blockButton(b) + '</div></div>';
    } else if (b.type === 'cta') {
      inner = '<div class="wrap block-cta">' + title + body + blockButton(b) + '</div>';
    } else if (b.type === 'cards') {
      var cards = (b.cards || []).filter(function (c) { return L(c.title) || L(c.text); });
      inner = '<div class="wrap">' + title + body +
        (cards.length ? '<ul class="block-cards" role="list">' + cards.map(function (c) {
          return '<li class="block-card"><h3>' + fmtText(L(c.title)) + '</h3>' + paragraphs(L(c.text)) + '</li>';
        }).join('') + '</ul>' : '') + blockButton(b) + '</div>';
    } else {
      inner = '<div class="wrap block-text">' + title + body + blockButton(b) + '</div>';
    }
    return '<section class="section cea-block ' + (BLOCK_BG[b.bg] || '') + '" data-block="' + esc(b.id) + '"' +
      (title ? ' aria-labelledby="' + tid + '"' : '') + '>' + inner + '</section>';
  }

  function tagSections() {
    var main = document.getElementById('contenu');
    if (!main) return;
    Array.prototype.forEach.call(main.children, function (s, i) { s.setAttribute('data-sec', i); });
  }

  function renderBlocks() {
    var main = document.getElementById('contenu');
    if (!main) return;
    main.querySelectorAll('.cea-block').forEach(function (b) { b.remove(); });
    var editing = document.documentElement.classList.contains('cea-editing');
    var hidden = (content.hidden && content.hidden[PAGE]) || [];
    var statics = main.querySelectorAll('[data-sec]');
    statics.forEach(function (s) {
      var off = hidden.indexOf(Number(s.getAttribute('data-sec'))) >= 0;
      s.classList.toggle('is-hidden-sec', off);
      if (s.id !== 'announcement') s.hidden = off && !editing;
    });
    var last = {};
    (content.blocks || []).filter(function (b) { return b.page === PAGE; }).forEach(function (b) {
      var tmp = document.createElement('div');
      tmp.innerHTML = blockHtml(b);
      var el = tmp.firstChild;
      var anchor = last[b.after] || main.querySelector('[data-sec="' + b.after + '"]');
      if (anchor) anchor.after(el); else main.prepend(el);
      last[b.after] = el;
    });
  }

  // Adresse du local + carte, mises à jour quand l'adresse change
  function renderAddress(el) {
    var a = (content.org || {}).address || '';
    el.innerHTML = addressHtml(content.org || {});
    var q = encodeURIComponent(a);
    var frame = document.querySelector('.map-frame');
    var src = 'https://maps.google.com/maps?q=' + q + '&z=15&output=embed';
    if (frame && a && frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    var open = document.querySelector('[data-map-link]');
    if (open && a) open.setAttribute('href', 'https://www.google.com/maps/search/?api=1&query=' + q);
  }

  var RENDERERS = {
    address: renderAddress,
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
    renderBlocks();
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
    afterRender();
  }
  function afterRender() { if (window.CEA && typeof window.CEA.onRender === 'function') window.CEA.onRender(); }

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
  // Interface utilisée par l'éditeur visuel (editor.js) et l'espace employés (admin.js)
  window.CEA = {
    loadContent: loadContent, saveContent: saveContent, resetContent: resetContent, normalize: normalize,
    esc: esc, t: t, L: L, fmtText: fmtText, safeHref: safeHref, safeImg: safeImg, page: PAGE,
    defaults: function () { return normalize(clone(window.DEFAULT_CONTENT)); },
    content: function () { return content; },
    setContent: function (c) { content = normalize(c); },
    save: function () { return saveContent(content); },
    lang: function () { return lang; },
    setLang: setLang,
    announce: announce,
    // Redessine tout le site à partir du contenu (après une modification)
    refresh: function () { buildHeader(); buildFooter(); applyLang(); renderAll(); },
    onRender: null
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyA11y();
    if (document.body.getAttribute('data-page') === 'admin') return; // l'espace employés est en français
    tagSections();
    keyTexts();
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
      afterRender();
    });
  });
})();
