(() => {
  if (window.top !== window || document.getElementById('ufsa-root')) return;

  const STORAGE_KEY = 'ufsaLectures';
  const SETTINGS_KEY = 'ufsaSettings';
  const FAVORITE_COURSES_KEY = 'ufsaFavoriteCourses';
  const LISTS_KEY = 'ufsaLists';
  const PAGE_KEY = location.href.split('#')[0];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  let video = null;
  let restoredForVideo = false;
  let lastSavedSecond = -1;
  let saveTimer = null;
  let panelOpen = false;
  let resizingPanel = false;

  const SVG = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M11 7V4L6 9l5 5v-3c3.3 0 5 1.6 5 4.7 0 1.4-.5 2.6-1.4 3.6l1.5 1.3c1.2-1.4 1.9-3.1 1.9-4.9C18 11.3 15.4 7 11 7z"/></svg>',
    forward: '<svg viewBox="0 0 24 24"><path d="M13 7V4l5 5-5 5v-3c-3.3 0-5 1.6-5 4.7 0 1.4.5 2.6 1.4 3.6l-1.5 1.3C5.7 19.2 5 17.5 5 15.7 5 11.3 7.6 7 13 7z"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 0 1 2 2v14l-4-3H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 5h10V6H7v2zm0 4h10v-2H7v2z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10-3h8v11h-8V10z"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="M19.4 13a7.8 7.8 0 0 0 .1-1 7.8 7.8 0 0 0-.1-1l2.1-1.6-2-3.4-2.5 1a8.6 8.6 0 0 0-1.7-1L15 3h-4l-.4 3a8.6 8.6 0 0 0-1.7 1L6.4 6l-2 3.4L6.5 11a7.8 7.8 0 0 0-.1 1 7.8 7.8 0 0 0 .1 1l-2.1 1.6 2 3.4 2.5-1a8.6 8.6 0 0 0 1.7 1l.4 3h4l.4-3a8.6 8.6 0 0 0 1.7-1l2.5 1 2-3.4L19.4 13zM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5z"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M14 2l8 8-3 1-4 4 1 5-2 2-5-7-5-5 2-2 5 1 4-4-1-3z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M7 7h10l-1 14H8L7 7zm2-4h6l1 2h4v2H4V5h4l1-2z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg>',
    keyboard: '<svg viewBox="0 0 24 24"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm2 3v2h2V8H5zm4 0v2h2V8H9zm4 0v2h2V8h-2zm4 0v2h2V8h-2zM5 12v2h2v-2H5zm4 0v2h6v-2H9zm8 0v2h2v-2h-2z"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.2-4.4-9.4-8.6C.4 8.2 2.7 4 7 4c2.2 0 3.8 1.1 5 2.6C13.2 5.1 14.8 4 17 4c4.3 0 6.6 4.2 4.4 8.4C19.2 16.6 12 21 12 21z"/></svg>',
    sos: '<svg viewBox="0 0 24 24"><path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V8h2v5z"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h5v-2h-4V6h-2v7h1z"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M4 5h2v2H4V5zm4 0h12v2H8V5zM4 11h2v2H4v-2zm4 0h12v2H8v-2zM4 17h2v2H4v-2zm4 0h12v2H8v-2z"/></svg>',
    fit: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5v2H6v3H4zm14-3h-3V4h5v5h-2V6zM6 15v3h3v2H4v-5h2zm12 3v-3h2v5h-5v-2h3z"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M9 4l1.5-2h3L15 4h4a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4zm3 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg>'
  };

  const fmt = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    const min = Math.floor((seconds / 60) % 60).toString().padStart(2, '0');
    const hr = Math.floor(seconds / 3600);
    return hr > 0 ? `${hr}:${min}:${sec}` : `${Number(min)}:${sec}`;
  };

  const contextAlive = () => {
    try { return Boolean(chrome?.runtime?.id && chrome?.storage?.local); } catch (_) { return false; }
  };

  const storageGet = (keys) => new Promise((resolve) => {
    if (!contextAlive()) return resolve({});
    try {
      chrome.storage.local.get(keys, (value) => resolve(value || {}));
    } catch (_) { resolve({}); }
  });

  const storageSet = (obj) => new Promise((resolve) => {
    if (!contextAlive()) return resolve(false);
    try {
      chrome.storage.local.set(obj, () => resolve(true));
    } catch (_) { resolve(false); }
  });

  function extractTitle() {
    const candidates = ['[class*="lecture"] h1','[class*="lecture"] h2','main h1','main h2','.card-title','.title','h1','h2'];
    for (const selector of candidates) {
      const text = $(selector)?.textContent?.trim();
      if (text && text.length > 4 && text.length < 180 && !/ΒΙΝΤΕΟΘΗΚΗ|UniFlix/i.test(text)) return text;
    }
    return document.title.replace(/\s*[|\-–—]\s*UniFlix.*$/i, '').trim() || 'UniFlix lecture';
  }

  function extractCourseTitle() {
    const breadcrumbSelectors = ['[class*="breadcrumb"] a','nav[aria-label*="breadcrumb" i] a','a[href*="course" i]','a[href*="mathima" i]'];
    const values = [];
    for (const selector of breadcrumbSelectors) {
      $$(selector).forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 4 && text.length < 150 && !/Αρχική|ΒΙΝΤΕΟΘΗΚΗ|UniFlix/i.test(text)) values.push(text);
      });
    }
    return values.at(-1) || extractTitle();
  }

  async function getLectures() {
    const data = await storageGet([STORAGE_KEY]);
    return data[STORAGE_KEY] || {};
  }

  async function getLecture() {
    const lectures = await getLectures();
    return lectures[PAGE_KEY] || null;
  }

  async function updateLecture(patch = {}) {
    const lectures = await getLectures();
    const current = lectures[PAGE_KEY] || {
      url: PAGE_KEY,
      title: extractTitle(),
      courseTitle: extractCourseTitle(),
      progress: 0,
      duration: 0,
      playbackRate: 1,
      notes: [],
      bookmarks: [],
      screenshots: 0,
      sos: false,
      watchLater: false,
      lastWatched: Date.now()
    };
    lectures[PAGE_KEY] = {
      ...current,
      ...patch,
      url: PAGE_KEY,
      title: extractTitle() || current.title,
      courseTitle: extractCourseTitle() || current.courseTitle || current.title,
      lastWatched: Date.now()
    };
    await storageSet({ [STORAGE_KEY]: lectures });
    return lectures[PAGE_KEY];
  }

  async function getSettings() {
    const data = await storageGet([SETTINGS_KEY]);
    return {
      pinned: false,
      autoResume: true,
      defaultSpeed: 1,
      autoOpen: false,
      fitPage: true,
      pageScale: 100,
      panelWidth: 430,
      ...(data[SETTINGS_KEY] || {})
    };
  }

  async function setSettings(patch) {
    const settings = { ...(await getSettings()), ...patch };
    await storageSet({ [SETTINGS_KEY]: settings });
    applyLayout(settings);
    return settings;
  }

  async function getFavoriteCourses() {
    const data = await storageGet([FAVORITE_COURSES_KEY]);
    return Array.isArray(data[FAVORITE_COURSES_KEY]) ? data[FAVORITE_COURSES_KEY] : [];
  }

  async function setFavoriteCourses(list) {
    return storageSet({ [FAVORITE_COURSES_KEY]: [...new Set(list)] });
  }

  async function getLists() {
    const data = await storageGet([LISTS_KEY]);
    return data[LISTS_KEY] && typeof data[LISTS_KEY] === 'object' ? data[LISTS_KEY] : {};
  }

  async function setLists(lists) { return storageSet({ [LISTS_KEY]: lists }); }

  function findBestVideo() {
    const videos = $$('video').filter(v => v.readyState >= 0);
    if (!videos.length) return null;
    const active = videos.find(v => !v.paused && !v.ended && v.readyState > 1);
    if (active) return active;
    return videos.sort((a, b) => (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight))[0];
  }

  function ensureVideo() {
    const found = findBestVideo();
    if (found && found !== video) {
      if (video) detachVideo(video);
      video = found;
      restoredForVideo = false;
      attachVideo(video);
    }
    return video;
  }

  function attachVideo(v) {
    ['loadedmetadata','durationchange'].forEach(ev => v.addEventListener(ev, onLoadedMetadata));
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('ratechange', onRateChange);
    v.addEventListener('play', renderProgress);
    v.addEventListener('pause', saveProgress);
    v.addEventListener('ended', saveProgress);
    onLoadedMetadata();
  }

  function detachVideo(v) {
    ['loadedmetadata','durationchange'].forEach(ev => v.removeEventListener(ev, onLoadedMetadata));
    v.removeEventListener('timeupdate', onTimeUpdate);
    v.removeEventListener('ratechange', onRateChange);
    v.removeEventListener('play', renderProgress);
    v.removeEventListener('pause', saveProgress);
    v.removeEventListener('ended', saveProgress);
  }

  async function onLoadedMetadata() {
    if (!video || restoredForVideo || !Number.isFinite(video.duration)) return;
    restoredForVideo = true;
    const saved = await getLecture();
    const settings = await getSettings();
    video.playbackRate = saved?.playbackRate || settings.defaultSpeed || 1;
    if (settings.autoResume && saved?.progress > 5 && saved.progress / video.duration < 0.98) {
      video.currentTime = Math.min(saved.progress, video.duration - 2);
      toast(`Συνέχεια από ${fmt(video.currentTime)}`, 'success');
    }
    await updateLecture({ duration: video.duration, playbackRate: video.playbackRate });
    renderAll();
  }

  function onTimeUpdate() {
    renderProgress();
    if (!video) return;
    const sec = Math.floor(video.currentTime || 0);
    if (sec !== lastSavedSecond && sec % 5 === 0) {
      lastSavedSecond = sec;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveProgress, 120);
    }
  }

  function onRateChange() {
    renderProgress();
    if (video) updateLecture({ playbackRate: video.playbackRate });
  }

  async function saveProgress() {
    const v = ensureVideo();
    if (!v) return;
    await updateLecture({
      progress: v.currentTime || 0,
      duration: Number.isFinite(v.duration) ? v.duration : 0,
      playbackRate: v.playbackRate || 1
    });
    renderProgress();
  }

  function toast(message, kind = 'default') {
    const el = $('#ufsa-toast');
    if (!el) return;
    el.className = `ufsa-toast ufsa-${kind}`;
    el.innerHTML = `${kind === 'success' ? '<span class="ufsa-toast-check">✓</span>' : ''}<span>${escapeHtml(message)}</span>`;
    requestAnimationFrame(() => el.classList.add('ufsa-show'));
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('ufsa-show'), 2400);
  }

  function buildUI() {
    const root = document.createElement('div');
    root.id = 'ufsa-root';
    root.innerHTML = `
      <aside id="ufsa-panel" aria-label="UniFlix Study Assistant">
        <div id="ufsa-resize-handle" class="ufsa-resize-handle" title="Σύρε για αλλαγή πλάτους"></div>
        <header class="ufsa-header">
          <div class="ufsa-brand">
            <div class="ufsa-logo">U</div>
            <div class="ufsa-brand-copy">
              <div class="ufsa-title">UniFlix Study Assistant</div>
              <div class="ufsa-tagline">Ο προσωπικός σου χώρος μελέτης ✨</div>
              <div class="ufsa-status"><span></span> Ενεργό σε αυτή τη σελίδα</div>
            </div>
          </div>
          <div class="ufsa-head-actions">
            <button id="ufsa-settings-btn" class="ufsa-icon-btn" title="Ρυθμίσεις">${SVG.settings}</button>
            <button id="ufsa-pin-btn" class="ufsa-icon-btn" title="Καρφίτσωμα">${SVG.pin}</button>
            <button id="ufsa-close" class="ufsa-icon-btn" title="Κλείσιμο">${SVG.close}</button>
          </div>
        </header>

        <nav class="ufsa-tabs" role="tablist">
          <button class="ufsa-tab ufsa-active" data-view="watch">${SVG.play}<span>Παρακολούθηση</span></button>
          <button class="ufsa-tab" data-view="notes">${SVG.note}<span>Σημειώσεις</span><b id="ufsa-notes-badge">0</b></button>
          <button class="ufsa-tab" data-view="bookmarks">${SVG.bookmark}<span>Bookmarks</span><b id="ufsa-bookmarks-badge">0</b></button>
          <button class="ufsa-tab" data-view="organize">${SVG.list}<span>Οργάνωση</span></button>
        </nav>

        <div id="ufsa-settings" class="ufsa-settings ufsa-hidden">
          <div class="ufsa-setting-row"><span>Αυτόματη συνέχεια</span><label class="ufsa-switch"><input id="ufsa-auto-resume" type="checkbox"><i></i></label></div>
          <div class="ufsa-setting-row"><span>Άνοιγμα panel αυτόματα</span><label class="ufsa-switch"><input id="ufsa-auto-open" type="checkbox"><i></i></label></div>
          <div class="ufsa-setting-row"><span>Προεπιλεγμένη ταχύτητα</span><select id="ufsa-default-speed"><option>0.75</option><option selected>1</option><option>1.25</option><option>1.5</option><option>2</option></select></div>
        </div>

        <div class="ufsa-body">
          <section class="ufsa-view ufsa-active" data-panel="watch">
            <article class="ufsa-card ufsa-player-card">
              <div class="ufsa-card-title">Έλεγχος αναπαραγωγής</div>
              <div class="ufsa-main-controls">
                <button id="ufsa-back" class="ufsa-round-btn" title="10 δευτερόλεπτα πίσω"><span>${SVG.back}</span><small>-10s</small></button>
                <button id="ufsa-back2" class="ufsa-round-btn ufsa-secondary" title="10 δευτερόλεπτα πίσω">${SVG.back}</button>
                <button id="ufsa-play" class="ufsa-round-btn ufsa-play-btn" title="Play / Pause">${SVG.play}</button>
                <button id="ufsa-forward2" class="ufsa-round-btn ufsa-secondary" title="10 δευτερόλεπτα μπροστά">${SVG.forward}</button>
                <button id="ufsa-forward" class="ufsa-round-btn" title="10 δευτερόλεπτα μπροστά"><span>${SVG.forward}</span><small>+10s</small></button>
                <button id="ufsa-shortcuts" class="ufsa-shortcut-btn">${SVG.keyboard}<span>Shortcuts</span></button>
              </div>
              <div class="ufsa-speed-row" id="ufsa-speed-row">
                ${[0.5,0.75,1,1.25,1.5,2,3].map(x => `<button data-speed="${x}" class="ufsa-speed">${x}×</button>`).join('')}
              </div>
            </article>

            <article class="ufsa-card">
              <div class="ufsa-card-head"><span class="ufsa-card-title">Πρόοδος διάλεξης</span><strong id="ufsa-percent">0%</strong></div>
              <div class="ufsa-progress"><div id="ufsa-progress-bar"></div></div>
              <div class="ufsa-progress-meta"><span id="ufsa-current">0:00</span><span id="ufsa-duration">0:00</span></div>
              <button id="ufsa-resume" class="ufsa-outline-primary">${SVG.play}<span>Συνέχεια από εδώ</span></button>
            </article>

            <div class="ufsa-quick-organize">
              <button id="ufsa-watch-later-quick" class="ufsa-quick-tile">${SVG.clock}<span><b>Για αργότερα</b><small>Αποθήκευση διάλεξης</small></span></button>
              <button id="ufsa-sos-quick" class="ufsa-quick-tile ufsa-quick-sos">${SVG.sos}<span><b>SOS διάλεξη</b><small>Για εξεταστική</small></span></button>
            </div>

            <article class="ufsa-card">
              <div class="ufsa-card-title">Γρήγορη σημείωση</div>
              <div class="ufsa-note-wrap">
                <textarea id="ufsa-note" placeholder="Γράψε μια σημείωση στο τρέχον σημείο..."></textarea>
                <span id="ufsa-note-time">0:00</span>
              </div>
              <div class="ufsa-note-tools">
                <button id="ufsa-add-note" class="ufsa-primary-btn">${SVG.note}<span>Προσθήκη</span></button>
                <button id="ufsa-template" class="ufsa-soft-btn"><span>✎</span><span>Πρότυπα</span></button>
                <button id="ufsa-screenshot" class="ufsa-soft-btn">${SVG.camera}<span>Screenshot</span></button>
              </div>
              <div id="ufsa-template-menu" class="ufsa-template-menu ufsa-hidden">
                <button data-template="Ορισμός: ">Ορισμός</button>
                <button data-template="Σημαντικό για εξέταση: ">Για εξέταση</button>
                <button data-template="Παράδειγμα: ">Παράδειγμα</button>
                <button data-template="Απορία: ">Απορία</button>
              </div>
            </article>

            <button id="ufsa-dashboard" class="ufsa-dashboard-hero">${SVG.dashboard}<span><b>Τα μαθήματά μου</b><small>Αγαπημένα · SOS · Λίστες · Για αργότερα</small></span><i>›</i></button>
          </section>

          <section class="ufsa-view" data-panel="notes">
            <div class="ufsa-section-head"><div><b>Σημειώσεις διάλεξης</b><small>Πάτησε timestamp για να μεταβείς στο σημείο.</small></div><span id="ufsa-notes-count">0</span></div>
            <div id="ufsa-notes-list" class="ufsa-list"></div>
          </section>

          <section class="ufsa-view" data-panel="bookmarks">
            <div class="ufsa-section-head"><div><b>Bookmarks</b><small>Τα σημαντικά σημεία της διάλεξης.</small></div><span id="ufsa-bookmarks-count">0</span></div>
            <div class="ufsa-bookmark-add"><input id="ufsa-bookmark-label" placeholder="Προαιρετικός τίτλος bookmark"><button id="ufsa-bookmark-add-btn">+ Προσθήκη</button></div>
            <div id="ufsa-bookmarks-list" class="ufsa-list"></div>
          </section>

          <section class="ufsa-view" data-panel="organize">
            <div class="ufsa-section-head"><div><b>Οργάνωση μελέτης</b><small>Κράτα μόνο ό,τι πραγματικά χρειάζεσαι.</small></div></div>

            <div class="ufsa-organize-grid">
              <button id="ufsa-favorite-course" class="ufsa-organize-card ufsa-fav-card">${SVG.heart}<span><b>Αγαπημένο μάθημα</b><small id="ufsa-course-name">Τρέχον μάθημα</small></span><i>♡</i></button>
              <button id="ufsa-sos" class="ufsa-organize-card ufsa-sos-card">${SVG.sos}<span><b>SOS διάλεξη</b><small>Σημαντική για εξεταστική</small></span><i>!</i></button>
              <button id="ufsa-watch-later" class="ufsa-organize-card ufsa-later-card">${SVG.clock}<span><b>Παρακολούθηση αργότερα</b><small>Βρες τη αμέσως στο dashboard</small></span><i>＋</i></button>
            </div>

            <article class="ufsa-card ufsa-list-card">
              <div class="ufsa-card-head"><span class="ufsa-card-title">Αποθήκευση σε λίστα</span><span class="ufsa-mini-chip">δικές σου λίστες</span></div>
              <p class="ufsa-helper">Φτιάξε λίστες όπως «Εξεταστική», «Να ξαναδώ», «Κεφάλαιο 3» και βάλε μέσα τις διαλέξεις σου.</p>
              <div class="ufsa-list-picker-row"><select id="ufsa-list-select"><option value="">Επίλεξε λίστα…</option></select><button id="ufsa-add-to-list" class="ufsa-primary-btn">＋ Προσθήκη</button></div>
              <div class="ufsa-new-list-row"><input id="ufsa-new-list-name" maxlength="60" placeholder="Όνομα νέας λίστας"><button id="ufsa-create-list" class="ufsa-soft-btn">Δημιουργία</button></div>
              <div id="ufsa-current-lists" class="ufsa-current-lists"></div>
            </article>

            <article class="ufsa-card ufsa-layout-card">
              <div class="ufsa-card-head"><span class="ufsa-card-title">Χώρος προβολής</span><span class="ufsa-mini-chip ufsa-fit-chip">${SVG.fit} χωρίς κάλυψη</span></div>
              <p class="ufsa-helper">Μίκρυνε ή μεγάλωσε το UniFlix ώστε το panel να μην κρύβει τη διάλεξη.</p>
              <div class="ufsa-setting-row ufsa-setting-emphasis"><span>Αυτόματο Fit δίπλα στο panel</span><label class="ufsa-switch"><input id="ufsa-fit-page" type="checkbox"><i></i></label></div>
              <div class="ufsa-range-head"><span>Μέγεθος UniFlix</span><strong id="ufsa-scale-value">100%</strong></div>
              <input id="ufsa-page-scale" class="ufsa-range" type="range" min="75" max="110" step="5" value="100">
              <div class="ufsa-scale-presets"><button data-scale="85">85%</button><button data-scale="90">90%</button><button data-scale="100">100%</button><button data-scale="110">110%</button></div>
              <div class="ufsa-range-head ufsa-panel-width-head"><span>Πλάτος extension</span><strong id="ufsa-panel-width-value">430px</strong></div>
              <input id="ufsa-panel-width" class="ufsa-range" type="range" min="360" max="540" step="10" value="430">
              <div class="ufsa-layout-tip">💡 Μπορείς επίσης να σύρεις την αριστερή άκρη του panel.</div>
            </article>
          </section>
        </div>

        <footer class="ufsa-footer"><span>♥ Μελέτη χωρίς χάος.</span><b>v2.1</b></footer>
      </aside>
      <button id="ufsa-fab" title="UniFlix Study Assistant"><span>U</span><i id="ufsa-fab-badge">0</i></button>
      <div id="ufsa-toast" class="ufsa-toast"></div>
      <div id="ufsa-shortcuts-modal" class="ufsa-modal ufsa-hidden">
        <div class="ufsa-modal-box"><div class="ufsa-modal-head"><b>Συντομεύσεις</b><button id="ufsa-shortcuts-close">×</button></div>
          <div class="ufsa-shortcuts-list"><span><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>←/→</kbd><b>±10s</b></span><span><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>↑/↓</kbd><b>Ταχύτητα</b></span><span><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>N</kbd><b>Νέα σημείωση</b></span><span><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>U</kbd><b>Άνοιγμα panel</b></span></div>
        </div>
      </div>
    `;
    document.documentElement.appendChild(root);
    bindUI();
  }

  function bindUI() {
    $$('.ufsa-tab').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    $('#ufsa-close').addEventListener('click', () => setPanel(false));
    $('#ufsa-fab').addEventListener('click', () => setPanel(!panelOpen));
    $('#ufsa-play').addEventListener('click', togglePlay);
    $('#ufsa-back').addEventListener('click', () => seekBy(-10));
    $('#ufsa-back2').addEventListener('click', () => seekBy(-10));
    $('#ufsa-forward').addEventListener('click', () => seekBy(10));
    $('#ufsa-forward2').addEventListener('click', () => seekBy(10));
    $('#ufsa-resume').addEventListener('click', togglePlay);
    $$('.ufsa-speed').forEach(btn => btn.addEventListener('click', () => setSpeed(Number(btn.dataset.speed))));
    $('#ufsa-add-note').addEventListener('click', addNote);
    $('#ufsa-note').addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addNote(); });
    $('#ufsa-template').addEventListener('click', () => $('#ufsa-template-menu').classList.toggle('ufsa-hidden'));
    $$('#ufsa-template-menu button').forEach(btn => btn.addEventListener('click', () => {
      const area = $('#ufsa-note');
      area.value = `${btn.dataset.template}${area.value}`;
      area.focus();
      $('#ufsa-template-menu').classList.add('ufsa-hidden');
    }));
    $('#ufsa-bookmark-add-btn').addEventListener('click', () => addBookmark($('#ufsa-bookmark-label').value.trim()));
    $('#ufsa-screenshot').addEventListener('click', captureScreenshot);
    $('#ufsa-dashboard').addEventListener('click', openDashboard);
    $('#ufsa-settings-btn').addEventListener('click', () => $('#ufsa-settings').classList.toggle('ufsa-hidden'));
    $('#ufsa-pin-btn').addEventListener('click', togglePin);
    $('#ufsa-shortcuts').addEventListener('click', () => $('#ufsa-shortcuts-modal').classList.remove('ufsa-hidden'));
    $('#ufsa-shortcuts-close').addEventListener('click', () => $('#ufsa-shortcuts-modal').classList.add('ufsa-hidden'));
    $('#ufsa-shortcuts-modal').addEventListener('click', e => { if (e.target.id === 'ufsa-shortcuts-modal') e.currentTarget.classList.add('ufsa-hidden'); });
    $('#ufsa-auto-resume').addEventListener('change', e => setSettings({ autoResume: e.target.checked }));
    $('#ufsa-auto-open').addEventListener('change', e => setSettings({ autoOpen: e.target.checked }));
    $('#ufsa-default-speed').addEventListener('change', e => setSettings({ defaultSpeed: Number(e.target.value) }));

    $('#ufsa-favorite-course').addEventListener('click', toggleFavoriteCourse);
    $('#ufsa-sos').addEventListener('click', toggleSOS);
    $('#ufsa-sos-quick').addEventListener('click', toggleSOS);
    $('#ufsa-watch-later').addEventListener('click', toggleWatchLater);
    $('#ufsa-watch-later-quick').addEventListener('click', toggleWatchLater);
    $('#ufsa-create-list').addEventListener('click', createListFromInput);
    $('#ufsa-new-list-name').addEventListener('keydown', e => { if (e.key === 'Enter') createListFromInput(); });
    $('#ufsa-add-to-list').addEventListener('click', addCurrentLectureToSelectedList);

    $('#ufsa-fit-page').addEventListener('change', e => setSettings({ fitPage: e.target.checked }));
    $('#ufsa-page-scale').addEventListener('input', e => {
      const scale = Number(e.target.value);
      $('#ufsa-scale-value').textContent = `${scale}%`;
      setSettings({ pageScale: scale });
    });
    $$('.ufsa-scale-presets button').forEach(btn => btn.addEventListener('click', () => {
      const scale = Number(btn.dataset.scale);
      $('#ufsa-page-scale').value = String(scale);
      $('#ufsa-scale-value').textContent = `${scale}%`;
      setSettings({ pageScale: scale });
    }));
    $('#ufsa-panel-width').addEventListener('input', e => {
      const panelWidth = Number(e.target.value);
      $('#ufsa-panel-width-value').textContent = `${panelWidth}px`;
      setSettings({ panelWidth });
    });

    const handle = $('#ufsa-resize-handle');
    handle.addEventListener('pointerdown', e => {
      resizingPanel = true;
      handle.setPointerCapture(e.pointerId);
      document.documentElement.classList.add('ufsa-resizing');
    });
    handle.addEventListener('pointermove', async e => {
      if (!resizingPanel) return;
      const width = Math.max(360, Math.min(540, window.innerWidth - e.clientX - 14));
      document.documentElement.style.setProperty('--ufsa-panel-width', `${width}px`);
      $('#ufsa-panel-width').value = String(Math.round(width / 10) * 10);
      $('#ufsa-panel-width-value').textContent = `${Math.round(width)}px`;
      applyLayout({ ...(await getSettings()), panelWidth: width });
    });
    const stopResize = async () => {
      if (!resizingPanel) return;
      resizingPanel = false;
      document.documentElement.classList.remove('ufsa-resizing');
      const width = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ufsa-panel-width')) || 430;
      await setSettings({ panelWidth: Math.max(360, Math.min(540, width)) });
    };
    handle.addEventListener('pointerup', stopResize);
    handle.addEventListener('pointercancel', stopResize);
  }

  function openDashboard() {
    if (!contextAlive()) return toast('Κάνε refresh στη σελίδα μετά την ενημέρωση του extension');
    try { chrome.runtime.sendMessage({ type: 'UFSA_OPEN_DASHBOARD' }); } catch (_) { toast('Κάνε refresh στη σελίδα'); }
  }

  async function applyLayout(settings = null) {
    settings = settings || await getSettings();
    const panelWidth = Math.max(360, Math.min(540, Number(settings.panelWidth) || 430));
    const scale = Math.max(75, Math.min(110, Number(settings.pageScale) || 100));
    document.documentElement.style.setProperty('--ufsa-panel-width', `${panelWidth}px`);
    if (!document.body) return;
    document.body.style.zoom = `${scale}%`;
    document.body.style.transition = 'max-width .24s ease, width .24s ease';
    if (panelOpen && settings.fitPage) {
      document.body.style.maxWidth = `calc((100vw - ${panelWidth + 22}px) * ${100 / scale})`;
      document.body.style.width = `calc((100vw - ${panelWidth + 22}px) * ${100 / scale})`;
      document.body.style.marginRight = 'auto';
      document.body.style.overflowX = 'hidden';
    } else {
      document.body.style.maxWidth = '';
      document.body.style.width = '';
      document.body.style.marginRight = '';
      document.body.style.overflowX = '';
    }
  }

  async function setPanel(open) {
    panelOpen = Boolean(open);
    $('#ufsa-panel').classList.toggle('ufsa-open', panelOpen);
    $('#ufsa-fab').classList.toggle('ufsa-panel-open', panelOpen);
    const settings = await getSettings();
    await applyLayout(settings);
    if (panelOpen) { ensureVideo(); renderAll(); }
  }

  async function togglePin() {
    const settings = await getSettings();
    const pinned = !settings.pinned;
    await setSettings({ pinned });
    $('#ufsa-pin-btn').classList.toggle('ufsa-active', pinned);
    toast(pinned ? 'Το panel καρφιτσώθηκε' : 'Το panel ξεκαρφιτσώθηκε', 'success');
  }

  function switchView(name) {
    $$('.ufsa-tab').forEach(btn => btn.classList.toggle('ufsa-active', btn.dataset.view === name));
    $$('.ufsa-view').forEach(panel => panel.classList.toggle('ufsa-active', panel.dataset.panel === name));
    if (name !== 'watch') $('#ufsa-template-menu')?.classList.add('ufsa-hidden');
    renderAll();
  }

  function togglePlay() {
    const v = ensureVideo();
    if (!v) return toast('Δεν βρέθηκε video σε αυτή τη σελίδα');
    if (v.paused) v.play().catch(() => toast('Πάτησε πρώτα Play στο UniFlix')); else v.pause();
    setTimeout(renderProgress, 60);
  }

  function seekBy(delta) {
    const v = ensureVideo();
    if (!v) return toast('Δεν βρέθηκε video');
    const max = Number.isFinite(v.duration) ? v.duration : Infinity;
    v.currentTime = Math.min(max, Math.max(0, (v.currentTime || 0) + delta));
    renderProgress();
  }

  function seekTo(time) {
    const v = ensureVideo();
    if (!v) return toast('Δεν βρέθηκε video');
    v.currentTime = Math.max(0, Number(time) || 0);
    setPanel(true);
    switchView('watch');
    renderProgress();
  }

  function setSpeed(rate) {
    const v = ensureVideo();
    if (!v) return toast('Δεν βρέθηκε video');
    v.playbackRate = rate;
    updateLecture({ playbackRate: rate });
    toast(`Ταχύτητα ${rate}×`, 'success');
    renderProgress();
  }

  async function addNote() {
    const text = $('#ufsa-note').value.trim();
    if (!text) return toast('Γράψε πρώτα μια σημείωση');
    const v = ensureVideo();
    const lecture = await getLecture() || await updateLecture();
    const note = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, time: v?.currentTime || lecture.progress || 0, text, createdAt: Date.now() };
    await updateLecture({ notes: [...(lecture.notes || []), note] });
    $('#ufsa-note').value = '';
    toast(`Σημείωση αποθηκεύτηκε στο ${fmt(note.time)}`, 'success');
    renderAll();
  }

  async function addBookmark(label = '') {
    const v = ensureVideo();
    const lecture = await getLecture() || await updateLecture();
    const time = v?.currentTime || lecture.progress || 0;
    const item = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, time, label: label || `Σημαντικό σημείο · ${fmt(time)}`, createdAt: Date.now() };
    await updateLecture({ bookmarks: [...(lecture.bookmarks || []), item] });
    if ($('#ufsa-bookmark-label')) $('#ufsa-bookmark-label').value = '';
    toast(`Bookmark στο ${fmt(time)}`, 'success');
    renderAll();
  }

  async function deleteItem(type, id) {
    const lecture = await getLecture();
    if (!lecture) return;
    const key = type === 'note' ? 'notes' : 'bookmarks';
    await updateLecture({ [key]: (lecture[key] || []).filter(x => x.id !== id) });
    renderAll();
  }

  async function toggleFavoriteCourse() {
    const lecture = await getLecture() || await updateLecture();
    const course = lecture.courseTitle || extractCourseTitle();
    const favorites = await getFavoriteCourses();
    const exists = favorites.includes(course);
    await setFavoriteCourses(exists ? favorites.filter(x => x !== course) : [...favorites, course]);
    toast(exists ? 'Αφαιρέθηκε από τα αγαπημένα' : 'Το μάθημα μπήκε στα αγαπημένα ♥', 'success');
    renderAll();
  }

  async function toggleSOS() {
    const lecture = await getLecture() || await updateLecture();
    const value = !Boolean(lecture.sos);
    await updateLecture({ sos: value });
    toast(value ? 'Η διάλεξη σημειώθηκε ως SOS' : 'Το SOS αφαιρέθηκε', 'success');
    renderAll();
  }

  async function toggleWatchLater() {
    const lecture = await getLecture() || await updateLecture();
    const value = !Boolean(lecture.watchLater);
    await updateLecture({ watchLater: value });
    toast(value ? 'Αποθηκεύτηκε για αργότερα' : 'Αφαιρέθηκε από το «Για αργότερα»', 'success');
    renderAll();
  }

  async function createListFromInput() {
    const input = $('#ufsa-new-list-name');
    const name = input.value.trim();
    if (!name) return toast('Γράψε όνομα για τη νέα λίστα');
    const lists = await getLists();
    const existing = Object.values(lists).find(x => x.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      $('#ufsa-list-select').value = existing.id;
      return toast('Υπάρχει ήδη λίστα με αυτό το όνομα');
    }
    const id = crypto.randomUUID?.() || `list-${Date.now()}`;
    lists[id] = { id, name, lectureUrls: [], createdAt: Date.now() };
    await setLists(lists);
    input.value = '';
    await renderLists();
    $('#ufsa-list-select').value = id;
    toast(`Δημιουργήθηκε η λίστα «${name}»`, 'success');
  }

  async function addCurrentLectureToSelectedList() {
    const id = $('#ufsa-list-select').value;
    if (!id) return toast('Επίλεξε ή δημιούργησε μία λίστα');
    await updateLecture();
    const lists = await getLists();
    if (!lists[id]) return renderLists();
    const urls = Array.isArray(lists[id].lectureUrls) ? lists[id].lectureUrls : [];
    if (urls.includes(PAGE_KEY)) return toast('Η διάλεξη υπάρχει ήδη σε αυτή τη λίστα');
    lists[id].lectureUrls = [...urls, PAGE_KEY];
    await setLists(lists);
    toast(`Προστέθηκε στη λίστα «${lists[id].name}»`, 'success');
    renderLists();
  }

  async function removeCurrentLectureFromList(id) {
    const lists = await getLists();
    if (!lists[id]) return;
    lists[id].lectureUrls = (lists[id].lectureUrls || []).filter(url => url !== PAGE_KEY);
    await setLists(lists);
    toast(`Αφαιρέθηκε από «${lists[id].name}»`, 'success');
    renderLists();
  }

  async function renderLists() {
    const lists = await getLists();
    const select = $('#ufsa-list-select');
    if (!select) return;
    const selected = select.value;
    select.innerHTML = '<option value="">Επίλεξε λίστα…</option>' + Object.values(lists)
      .sort((a,b) => (a.name || '').localeCompare(b.name || '', 'el'))
      .map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join('');
    if (lists[selected]) select.value = selected;
    const current = Object.values(lists).filter(x => (x.lectureUrls || []).includes(PAGE_KEY));
    $('#ufsa-current-lists').innerHTML = current.length
      ? current.map(x => `<button class="ufsa-list-pill" data-remove-list="${escapeHtml(x.id)}"><span>${escapeHtml(x.name)}</span><b>×</b></button>`).join('')
      : '<span class="ufsa-no-list">Δεν έχει μπει ακόμη σε λίστα.</span>';
    $$('[data-remove-list]').forEach(btn => btn.addEventListener('click', () => removeCurrentLectureFromList(btn.dataset.removeList)));
  }

  async function captureScreenshot() {
    const v = ensureVideo();
    if (!v) return toast('Δεν βρέθηκε video');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth || v.clientWidth;
      canvas.height = v.videoHeight || v.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,.65)';
      ctx.fillRect(0, canvas.height - 42, 220, 42);
      ctx.fillStyle = '#fff';
      ctx.font = '600 18px system-ui';
      ctx.fillText(`UniFlix · ${fmt(v.currentTime)}`, 14, canvas.height - 15);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('no blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uniflix-${fmt(v.currentTime).replaceAll(':','-')}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const lecture = await getLecture() || await updateLecture();
      await updateLecture({ screenshots: (lecture.screenshots || 0) + 1 });
      toast('Το screenshot αποθηκεύτηκε', 'success');
    } catch (_) {
      toast('Το συγκεκριμένο video δεν επιτρέπει screenshot από extension');
    }
  }

  function renderProgress() {
    const v = ensureVideo();
    const current = v?.currentTime || 0;
    const duration = Number.isFinite(v?.duration) ? v.duration : 0;
    const percent = duration > 0 ? Math.min(100, Math.round(current / duration * 100)) : 0;
    if ($('#ufsa-current')) $('#ufsa-current').textContent = fmt(current);
    if ($('#ufsa-duration')) $('#ufsa-duration').textContent = fmt(duration);
    if ($('#ufsa-percent')) $('#ufsa-percent').textContent = `${percent}%`;
    if ($('#ufsa-progress-bar')) $('#ufsa-progress-bar').style.width = `${percent}%`;
    if ($('#ufsa-note-time')) $('#ufsa-note-time').textContent = fmt(current);
    if ($('#ufsa-play')) $('#ufsa-play').innerHTML = v && !v.paused ? SVG.pause : SVG.play;
    $$('.ufsa-speed').forEach(btn => btn.classList.toggle('ufsa-active', Math.abs(Number(btn.dataset.speed) - (v?.playbackRate || 1)) < 0.001));
  }

  async function renderAll() {
    renderProgress();
    const lecture = await getLecture();
    const settings = await getSettings();
    const favoriteCourses = await getFavoriteCourses();
    $('#ufsa-auto-resume').checked = settings.autoResume;
    $('#ufsa-auto-open').checked = settings.autoOpen;
    $('#ufsa-default-speed').value = String(settings.defaultSpeed);
    $('#ufsa-pin-btn').classList.toggle('ufsa-active', settings.pinned);
    $('#ufsa-fit-page').checked = settings.fitPage;
    $('#ufsa-page-scale').value = String(settings.pageScale);
    $('#ufsa-scale-value').textContent = `${settings.pageScale}%`;
    $('#ufsa-panel-width').value = String(Math.round(settings.panelWidth / 10) * 10);
    $('#ufsa-panel-width-value').textContent = `${Math.round(settings.panelWidth)}px`;
    await applyLayout(settings);

    const notes = lecture?.notes || [];
    const bookmarks = lecture?.bookmarks || [];
    $('#ufsa-notes-badge').textContent = notes.length;
    $('#ufsa-bookmarks-badge').textContent = bookmarks.length;
    $('#ufsa-notes-count').textContent = notes.length;
    $('#ufsa-bookmarks-count').textContent = bookmarks.length;
    $('#ufsa-fab-badge').textContent = notes.length + bookmarks.length;
    $('#ufsa-fab-badge').style.display = notes.length + bookmarks.length ? 'grid' : 'none';

    const course = lecture?.courseTitle || extractCourseTitle();
    $('#ufsa-course-name').textContent = course;
    const fav = favoriteCourses.includes(course);
    $('#ufsa-favorite-course').classList.toggle('ufsa-selected', fav);
    $('#ufsa-favorite-course i').textContent = fav ? '♥' : '♡';
    $('#ufsa-sos').classList.toggle('ufsa-selected', Boolean(lecture?.sos));
    $('#ufsa-sos-quick').classList.toggle('ufsa-selected', Boolean(lecture?.sos));
    $('#ufsa-watch-later').classList.toggle('ufsa-selected', Boolean(lecture?.watchLater));
    $('#ufsa-watch-later-quick').classList.toggle('ufsa-selected', Boolean(lecture?.watchLater));

    $('#ufsa-notes-list').innerHTML = notes.length ? notes.slice().sort((a,b) => a.time - b.time).map(n => `
      <div class="ufsa-list-item">
        <div class="ufsa-list-top"><button class="ufsa-time-link" data-time="${n.time}">${fmt(n.time)}</button><button class="ufsa-delete" data-note="${n.id}" title="Διαγραφή">${SVG.trash}</button></div>
        <div class="ufsa-list-text">${escapeHtml(n.text)}</div>
      </div>`).join('') : '<div class="ufsa-empty">Δεν υπάρχουν σημειώσεις ακόμη.<br>Πρόσθεσε μία από την καρτέλα «Παρακολούθηση».</div>';

    $('#ufsa-bookmarks-list').innerHTML = bookmarks.length ? bookmarks.slice().sort((a,b) => a.time - b.time).map(b => `
      <div class="ufsa-list-item ufsa-bookmark-item">
        <div class="ufsa-list-top"><button class="ufsa-time-link" data-time="${b.time}">${fmt(b.time)}</button><button class="ufsa-delete" data-bookmark="${b.id}" title="Διαγραφή">${SVG.trash}</button></div>
        <div class="ufsa-list-text">${escapeHtml(b.label)}</div>
      </div>`).join('') : '<div class="ufsa-empty">Δεν υπάρχουν bookmarks ακόμη.</div>';

    $$('.ufsa-time-link').forEach(btn => btn.addEventListener('click', () => seekTo(Number(btn.dataset.time))));
    $$('[data-note]').forEach(btn => btn.addEventListener('click', () => deleteItem('note', btn.dataset.note)));
    $$('[data-bookmark]').forEach(btn => btn.addEventListener('click', () => deleteItem('bookmark', btn.dataset.bookmark)));
    await renderLists();
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!(e.altKey && e.shiftKey)) return;
      if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); seekBy(-10); }
      if (e.key === 'ArrowRight') { e.preventDefault(); seekBy(10); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSpeed(Math.min(3, Math.round(((ensureVideo()?.playbackRate || 1) + .25) * 4) / 4)); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSpeed(Math.max(.5, Math.round(((ensureVideo()?.playbackRate || 1) - .25) * 4) / 4)); }
      if (e.key.toLowerCase() === 'n') { e.preventDefault(); setPanel(true); switchView('watch'); $('#ufsa-note').focus(); }
    }, true);
  }

  async function init() {
    buildUI();
    bindKeyboard();
    const settings = await getSettings();
    panelOpen = settings.autoOpen || false;
    await setPanel(panelOpen);
    ensureVideo();
    await updateLecture();
    renderAll();
    const observer = new MutationObserver(() => ensureVideo());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setInterval(() => { ensureVideo(); if (panelOpen) renderProgress(); }, 1000);
  }

  try {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg?.type === 'UFSA_TOGGLE_PANEL') setPanel(!panelOpen);
    });
  } catch (_) {}

  init();
})();
