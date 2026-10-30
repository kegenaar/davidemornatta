// App bootstrap: saving, routing and static pages (home, lesson list, rules).
(function (root) {
  const BG = root.BG;
  const { t } = BG;

  // ---------- saving ----------
  const load = (k, d) => {
    try { return Object.assign(d, JSON.parse(localStorage.getItem(k) || '{}')); } catch (e) { return d; }
  };
  BG.progress = load('tr_progress', { lessons: {}, stats: { games: 0, wins: 0, losses: 0, points: 0 } });
  BG.settings = load('tr_settings', { sound: true, showMoves: true, showNumbers: true, coach: true, level: 'facile' });
  BG.save = () => {
    localStorage.setItem('tr_progress', JSON.stringify(BG.progress));
    localStorage.setItem('tr_settings', JSON.stringify(BG.settings));
  };

  // ---------- shared helpers ----------
  BG.h = (html) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  };
  BG.delay = (ms) => new Promise((r) => setTimeout(r, ms));
  BG.coachAvatar = () => `<div class="coach-avatar"><svg viewBox="0 0 40 40">
      <circle cx="20" cy="15" r="8" fill="#fff"/><path d="M6 37c1-8 7-12 14-12s13 4 14 12z" fill="#fff"/>
      <circle cx="17" cy="14.5" r="1.3" fill="#3d6127"/><circle cx="23" cy="14.5" r="1.3" fill="#3d6127"/>
      <path d="M16.5 18.5q3.5 2.5 7 0" stroke="#3d6127" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <rect x="11" y="5" width="18" height="4" rx="1.5" fill="#262421"/><rect x="14" y="1.5" width="12" height="5" rx="1" fill="#262421"/></svg></div>`;
  BG.lessonsDone = () => BG.LESSONS.filter((l) => BG.progress.lessons[l.id]).length;

  // ---------- routing ----------
  BG.views = BG.views || {};
  let current = null;
  // Italian routes kept as aliases so old links keep working.
  const ROUTES = { '': 'home', lessons: 'lessons', lesson: 'lesson', play: 'play', rules: 'rules',
    lezioni: 'lessons', lezione: 'lesson', gioca: 'play', regole: 'rules' };
  const NAV = { home: 'home', lessons: 'lessons', lesson: 'lessons', play: 'play', rules: 'rules' };

  function route() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [name, param] = hash.split('/');
    const view = document.getElementById('view');
    if (current && current.unmount) current.unmount();
    view.innerHTML = '';
    window.scrollTo(0, 0);
    const key = ROUTES[name] || 'home';
    current = BG.views[key];
    current.mount(view, param);
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === NAV[key]));
  }

  function renderSoundToggle() {
    const b = document.getElementById('soundToggle');
    const on = BG.settings.sound;
    b.innerHTML = on
      ? `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg><span>${t('Sound on', 'Audio attivo')}</span>`
      : `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/></svg><span>${t('Sound off', 'Audio spento')}</span>`;
    b.setAttribute('aria-pressed', on);
    BG.Sound.enabled = on;
  }

  BG.start = () => {
    document.documentElement.lang = BG.lang;
    document.title = t('Tavola Reale — Learn backgammon', 'Tavola Reale — Impara il backgammon');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(...el.dataset.i18n.split('|')); });
    const lang = document.getElementById('langToggle');
    lang.innerHTML = BG.lang === 'it' ? 'EN · <b>IT</b>' : '<b>EN</b> · IT';
    lang.title = t('Passa all\'italiano', 'Switch to English');
    lang.onclick = () => BG.setLang(BG.lang === 'it' ? 'en' : 'it');
    renderSoundToggle();
    document.getElementById('soundToggle').addEventListener('click', () => {
      BG.settings.sound = !BG.settings.sound;
      BG.save();
      renderSoundToggle();
    });
    window.addEventListener('hashchange', route);
    route();
  };

  // ---------- Home ----------
  BG.views.home = {
    mount(el) {
      const done = BG.lessonsDone();
      const total = BG.LESSONS.length;
      const st = BG.progress.stats;
      const next = BG.LESSONS.find((l) => !BG.progress.lessons[l.id]);
      el.appendChild(BG.h(`<div class="home">
        <div>
          <h1>${t('Learn backgammon<br>from scratch.', 'Impara il backgammon<br>da zero.')}</h1>
          <p class="lead">${t(
            'Interactive lessons, a coach that guides you step by step and an opponent to practise what you\'ve learned. By the end you\'ll be able to play a full game.',
            'Lezioni interattive, un coach che ti guida passo dopo passo e un avversario contro cui mettere in pratica ciò che hai imparato. Alla fine saprai giocare una partita completa.')}</p>
          <div class="cta">
            <a class="btn btn-primary btn-big" href="#/${next ? 'lesson/' + next.id : 'lessons'}"><span class="bi">🎓</span><span>${done ? t('Keep learning', 'Continua a imparare') : t('Start learning', 'Inizia a imparare')}<small>${next ? t('Next: ', 'Prossima: ') + next.title : t('All lessons completed!', 'Tutte le lezioni completate!')}</small></span></a>
            <a class="btn btn-big" href="#/play"><span class="bi">🎲</span><span>${t('Play against the computer', 'Gioca contro il computer')}<small>${t('With the coach rating your moves', 'Con il coach che valuta le tue mosse')}</small></span></a>
          </div>
          <div class="stats">
            <div class="stat"><b>${done}/${total}</b><span>${t('Lessons', 'Lezioni')}</span></div>
            <div class="stat"><b>${st.wins}</b><span>${t('Wins', 'Vittorie')}</span></div>
            <div class="stat"><b>${st.games}</b><span>${t('Games', 'Partite')}</span></div>
          </div>
        </div>
        <div class="home-board"><div id="homeBoard"></div></div>
      </div>`));
      const b = new BG.Board(el.querySelector('#homeBoard'), { showNumbers: false });
      b.set({ state: BG.initialState(), dice: [{ values: [6, 3], player: BG.W }] });
    },
  };

  // ---------- Lesson list ----------
  BG.views.lessons = {
    mount(el) {
      const done = BG.lessonsDone();
      const total = BG.LESSONS.length;
      const next = BG.LESSONS.find((l) => !BG.progress.lessons[l.id]);
      const cards = BG.LESSONS.map((l, i) => {
        const ok = !!BG.progress.lessons[l.id];
        return `<a class="lesson-card ${ok ? 'done' : ''} ${next === l ? 'next' : ''}" href="#/lesson/${l.id}">
          <div class="num">${ok ? '✓' : l.icon}</div>
          <div class="txt"><b>${i + 1}. ${l.title}</b><span>${l.desc}</span></div>
          <div class="state">${ok ? t('Completed', 'Completata') : next === l ? t('Start ›', 'Inizia ›') : l.steps.length + t(' steps', ' passi')}</div></a>`;
      }).join('');
      el.appendChild(BG.h(`<div class="page">
        <div class="page-title"><h1>${t('Learn', 'Impara')}</h1></div>
        <div class="overall"><b>${done} ${t('of', 'di')} ${total} ${t('lessons', 'lezioni')}</b><div class="bar"><i style="width:${(done / total) * 100}%"></i></div><span class="eyebrow">${Math.round((done / total) * 100)}%</span></div>
        <div class="lesson-list">${cards}
          <a class="lesson-card final-card" href="#/play"><div class="num">🎲</div><div class="txt"><b>${t('Final exam: play a game', 'Esame finale: gioca una partita')}</b><span>${t('Put it all into practice against the computer.', 'Metti in pratica tutto contro il computer.')}</span></div><div class="state">${t('Play ›', 'Gioca ›')}</div></a>
        </div></div>`));
    },
  };

  // ---------- Rules ----------
  const RULES_EN = `
        <h1>Rules in brief</h1>
        <section><h2>Goal of the game</h2>
          <p>Each player has 15 checkers. The first to bring all their checkers into their home board and then bear them off the board wins.</p></section>
        <section><h2>The board</h2>
          <ul><li>24 points (triangles), numbered from your point of view from 1 to 24.</li>
          <li>Your <b>home board</b> is points 1–6 (bottom right); your opponent's is points 19–24.</li>
          <li>White's starting position: 2 checkers on 24, 5 on 13, 3 on 8, 5 on 6. Black is set up as a mirror image.</li></ul></section>
        <section><h2>Starting</h2>
          <p>Each player rolls one die: the higher number goes first and uses both numbers rolled as the first move. On a tie, roll again.</p></section>
        <section><h2>Moving</h2>
          <ul><li>Each die is a separate move: you can move one checker with both dice or two different checkers.</li>
          <li>With a <b>double</b> you play the number four times.</li>
          <li>You can land on an empty point, one with your own checkers, or one with <b>a single</b> opposing checker. A point with 2+ opposing checkers is blocked.</li>
          <li>You must use both dice if possible; if you can use only one, and you have a choice, you must use the higher. If you can't move, you lose your turn.</li></ul></section>
        <section><h2>Hitting and entering</h2>
          <ul><li>If you land on an opposing blot you hit it: it goes to the bar.</li>
          <li>A player with checkers on the bar must enter them first, in the opponent's home board: entry point = 25 − die.</li></ul></section>
        <section><h2>Bearing off</h2>
          <ul><li>You can bear off only when all 15 checkers are in your home board.</li>
          <li>A die bears off a checker from the matching point. If the die is higher than your highest point, you bear off from your highest point.</li></ul></section>
        <section><h2>Scoring</h2>
          <ul><li><b>Single win</b>: 1 point.</li><li><b>Gammon</b>: your opponent hasn't borne off any checkers — 2 points.</li>
          <li><b>Backgammon</b>: on top of that they still have checkers on the bar or in your home board — 3 points.</li></ul></section>
        <section><h2>Glossary</h2><dl class="gloss">
          <dt>Point</dt><dd>One of the 24 triangles; also: a triangle held by 2+ checkers of the same colour.</dd>
          <dt>Blot</dt><dd>A single checker on a point, which can be hit.</dd>
          <dt>Bar</dt><dd>The strip in the middle where hit checkers go.</dd>
          <dt>Home board</dt><dd>The last six points of each player (1–6 for you).</dd>
          <dt>Bear off</dt><dd>Taking checkers off the board at the end of the track.</dd>
          <dt>Pip</dt><dd>One point of distance. The pip count is the total distance all your checkers still have to travel.</dd>
          <dt>Double</dt><dd>The same number on both dice: you move four times.</dd>
          <dt>Anchor</dt><dd>A point you hold in your opponent's home board.</dd>
          <dt>Prime</dt><dd>Several consecutive blocked points: hard for your opponent to get past.</dd>
          <dt>Race</dt><dd>The phase where the two players' checkers can no longer touch.</dd>
        </dl></section>
        <p style="text-align:center;margin:22px 0"><a class="btn btn-primary" href="#/lessons">Go to the interactive lessons</a></p>`;

  const RULES_IT = `
        <h1>Regole in breve</h1>
        <section><h2>Scopo del gioco</h2>
          <p>Ogni giocatore ha 15 pedine. Vince chi porta per primo tutte le sue pedine nella propria casa e poi le fa uscire dal tabellone.</p></section>
        <section><h2>Il tabellone</h2>
          <ul><li>24 punti (triangoli), numerati dal tuo punto di vista da 1 a 24.</li>
          <li>La tua <b>casa</b> sono i punti 1–6 (in basso a destra); quella dell'avversario i punti 19–24.</li>
          <li>Posizione iniziale del bianco: 2 pedine sul 24, 5 sul 13, 3 sull'8, 5 sul 6. Il nero è disposto in modo speculare.</li></ul></section>
        <section><h2>Inizio</h2>
          <p>Ognuno lancia un dado: chi fa il numero più alto inizia e usa i due numeri usciti come prima mossa. In caso di parità si rilancia.</p></section>
        <section><h2>Muovere</h2>
          <ul><li>Ogni dado è una mossa separata: puoi muovere una pedina sola con entrambi i dadi o due pedine diverse.</li>
          <li>Con un <b>doppio</b> giochi il numero quattro volte.</li>
          <li>Puoi atterrare su un punto vuoto, con tue pedine o con <b>una sola</b> pedina avversaria. Un punto con 2+ pedine avversarie è bloccato.</li>
          <li>Devi usare entrambi i dadi se possibile; se puoi usarne uno solo, quando puoi scegliere devi usare il più alto. Se non puoi muovere, perdi il turno.</li></ul></section>
        <section><h2>Colpire e rientrare</h2>
          <ul><li>Se atterri su una pedina avversaria scoperta la colpisci: va sulla barra.</li>
          <li>Chi ha pedine sulla barra deve farle rientrare per prime, nella casa avversaria: punto di ingresso = 25 − dado.</li></ul></section>
        <section><h2>Uscita</h2>
          <ul><li>Puoi far uscire le pedine solo quando tutte e 15 sono nella tua casa.</li>
          <li>Un dado fa uscire una pedina dal punto corrispondente. Se il dado è più alto del tuo punto più lontano, esci dal punto più lontano.</li></ul></section>
        <section><h2>Punteggio</h2>
          <ul><li><b>Vittoria semplice</b>: 1 punto.</li><li><b>Gammon</b>: l'avversario non ha fatto uscire nessuna pedina — 2 punti.</li>
          <li><b>Backgammon</b>: in più ha pedine sulla barra o nella tua casa — 3 punti.</li></ul></section>
        <section><h2>Glossario</h2><dl class="gloss">
          <dt>Punto</dt><dd>Uno dei 24 triangoli; anche: un triangolo occupato da 2+ pedine dello stesso colore.</dd>
          <dt>Pedina scoperta (blot)</dt><dd>Una pedina sola su un punto, che può essere colpita.</dd>
          <dt>Barra</dt><dd>La striscia centrale dove vanno le pedine colpite.</dd>
          <dt>Casa</dt><dd>I sei punti finali di ogni giocatore (1–6 per te).</dd>
          <dt>Uscita (bear off)</dt><dd>Togliere le pedine dal tabellone a fine percorso.</dd>
          <dt>Pip</dt><dd>Un punto di distanza. Il conteggio dei pip è la somma delle distanze che mancano a tutte le tue pedine.</dd>
          <dt>Doppio</dt><dd>Lo stesso numero su entrambi i dadi: si muove quattro volte.</dd>
          <dt>Ancora</dt><dd>Un punto tuo nella casa dell'avversario.</dd>
          <dt>Prime</dt><dd>Più punti consecutivi bloccati: difficili da superare per l'avversario.</dd>
          <dt>Corsa</dt><dd>Fase in cui le pedine dei due giocatori non possono più toccarsi.</dd>
        </dl></section>
        <p style="text-align:center;margin:22px 0"><a class="btn btn-primary" href="#/lessons">Vai alle lezioni interattive</a></p>`;

  BG.views.rules = {
    mount(el) {
      el.appendChild(BG.h(`<div class="rules">${t(RULES_EN, RULES_IT)}</div>`));
    },
  };
})(window);
