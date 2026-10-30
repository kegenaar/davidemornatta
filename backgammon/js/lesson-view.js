// Pagina della singola lezione: tabellone + pannello del coach con i passi.
(function (root) {
  const BG = root.BG;
  const { t } = BG;

  const LOC_NAME = (loc) => (loc === 'bar' ? t('the bar', 'la barra') : loc === 'off' ? t('the tray', 'il vassoio') : t('point ', 'il punto ') + loc);

  BG.views.lesson = {
    mount(el, id) {
      const idx = Math.max(0, BG.LESSONS.findIndex((l) => l.id === id));
      const lesson = BG.LESSONS[idx];
      this.lesson = lesson;
      this.idx = idx;
      el.appendChild(BG.h(`<div class="layout">
        <div class="board-col"><div class="board-holder"><div id="lb"></div></div></div>
        <aside class="panel">
          <div class="panel-head"><a class="back" href="#/lessons" title="${t('All lessons', 'Tutte le lezioni')}">‹</a>
            <div><div class="eyebrow">${t('Lesson', 'Lezione')} ${idx + 1} ${t('of', 'di')} ${BG.LESSONS.length}</div><h2>${lesson.title}</h2></div></div>
          <div class="steps"></div>
          <div class="panel-body">
            <div class="coach">${BG.coachAvatar()}<div class="bubble"></div></div>
            <div class="extra"></div>
            <div class="fb"></div>
          </div>
          <div class="panel-foot">
            <button class="btn btn-ghost prev" title="${t('Back', 'Indietro')} (←)">‹ ${t('Back', 'Indietro')}</button>
            <div class="grow"></div>
            <button class="btn btn-primary next">${t('Next', 'Avanti')} ›</button>
          </div>
        </aside></div>`));
      this.el = el;
      this.board = new BG.Board(el.querySelector('#lb'), { showNumbers: true });
      this.$ = (s) => el.querySelector(s);
      this.$('.prev').onclick = () => this.go(this.step - 1);
      this.$('.next').onclick = () => this.next();
      this.onKey = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'Enter') { if (this.solved) this.next(); }
        else if (e.key === 'ArrowLeft') this.go(this.step - 1);
      };
      document.addEventListener('keydown', this.onKey);
      this.go(0);
    },

    unmount() {
      document.removeEventListener('keydown', this.onKey);
      this.token = null;
    },

    next() {
      if (!this.solved) return;
      if (this.step < this.lesson.steps.length - 1) this.go(this.step + 1);
      else this.complete();
    },

    feedback(kind, html) {
      const ico = { ok: '✓', bad: '✕', info: 'i' }[kind];
      this.$('.fb').innerHTML = html ? `<div class="feedback ${kind}"><span class="ico">${ico}</span><div>${html}</div></div>` : '';
    },

    setSolved(v) {
      this.solved = v;
      this.$('.next').disabled = !v;
    },

    renderSteps() {
      this.$('.steps').innerHTML = this.lesson.steps
        .map((_, i) => `<i class="${i < this.step ? 'done' : i === this.step ? 'cur' : ''}"></i>`).join('');
    },

    go(i) {
      const steps = this.lesson.steps;
      if (i < 0 || i >= steps.length) return;
      if (this.ctrl) { this.ctrl.detach(); this.ctrl = null; }
      this.token = {};
      this.step = i;
      const st = steps[i];
      this.stepDef = st;
      this.renderSteps();
      this.$('.panel-body').scrollTop = 0;
      this.$('.prev').disabled = i === 0;
      this.$('.next').textContent = i === steps.length - 1 ? t('Complete ✓', 'Completa ✓') : t('Next ›', 'Avanti ›');
      this.$('.bubble').innerHTML = st.text;
      this.$('.extra').innerHTML = '';
      this.feedback(null);
      const b = this.board;
      b.interaction = null;
      b.onLocClick = null;
      let dice = [];
      if (st.openingDice) dice = [{ values: [st.openingDice[0]], player: BG.W }, { values: [st.openingDice[1]], player: BG.B }];
      else if (st.dice && st.type !== 'move') dice = [{ values: st.dice, player: BG.W }];
      b.set({
        state: BG.fromSpec(st.board || {}), highlights: st.highlights || [], arrows: st.arrows || [],
        dice, lastMove: [], selected: null, targets: [],
      });
      this.setSolved(st.type === 'info');
      if (st.type === 'click') this.setupClick(st);
      if (st.type === 'quiz') this.setupQuiz(st);
      if (st.type === 'move') this.setupMove(st);
      if (st.cta) {
        this.$('.extra').appendChild(BG.h(`<a class="btn btn-primary btn-block" href="#/play">🎲 ${t('Play a game', 'Gioca una partita')}</a>`));
      }
    },

    setupClick(st) {
      const b = this.board;
      b.onLocClick = (loc) => {
        if (this.solved) return;
        if (st.target.includes(loc)) {
          BG.Sound.play('success');
          b.set({ highlights: [{ loc, color: 'good' }] });
          this.feedback('ok', t('Correct! This is ', 'Corretto! Questo è ') + LOC_NAME(loc) + '.');
          this.setSolved(true);
        } else {
          BG.Sound.play('error');
          b.set({ highlights: [{ loc, color: 'bad' }] });
          this.feedback('bad', t('No, that\'s ', 'No, quello è ') + LOC_NAME(loc) + t('. Try again!', '. Riprova!'));
        }
      };
    },

    setupQuiz(st) {
      const box = BG.h('<div class="options"></div>');
      st.options.forEach((o) => {
        const btn = BG.h(`<button class="option">${o.t}</button>`);
        btn.onclick = () => {
          if (this.solved) return;
          if (o.correct) {
            btn.classList.add('right');
            BG.Sound.play('success');
            this.feedback('ok', o.why || t('Correct!', 'Corretto!'));
            this.setSolved(true);
          } else {
            box.querySelectorAll('.option').forEach((x) => x.classList.remove('wrong'));
            btn.classList.add('wrong');
            BG.Sound.play('error');
            this.feedback('bad', (o.why || t('Not quite.', 'Non è corretto.')) + t(' Try again!', ' Riprova!'));
          }
        };
        box.appendChild(btn);
      });
      this.$('.extra').appendChild(box);
    },

    setupMove(st) {
      const start = BG.fromSpec(st.board || {});
      this.board.set({ state: start, arrows: st.arrows || [] });
      this.evaluated = false;
      this.ctrl = new BG.TurnController(this.board, {
        state: start, dice: st.dice, onChange: (c) => this.onMoveChange(c),
        onReject: (msg) => this.feedback('info', msg),
      });
    },

    actions(buttons) {
      const box = BG.h('<div class="actions"></div>');
      for (const [label, cls, fn] of buttons) {
        const b = BG.h(`<button class="btn ${cls}">${label}</button>`);
        b.onclick = fn;
        box.appendChild(b);
      }
      this.$('.extra').innerHTML = '';
      this.$('.extra').appendChild(box);
    },

    onMoveChange(c) {
      const st = this.stepDef;
      if (this.solved) return;
      if (c.noMovesAtAll) {
        this.actions([[t('Pass the turn', 'Passa il turno'), 'btn-primary', () => {
          BG.Sound.play('success');
          this.feedback('ok', st.success);
          this.$('.extra').innerHTML = '';
          this.setSolved(true);
        }]]);
        return;
      }
      if (!c.done) {
        this.evaluated = false;
        this.feedback(null);
        this.actions(c.history.length ? [[t('↶ Undo', '↶ Annulla'), '', () => c.undo()]] : []);
        return;
      }
      if (this.evaluated) return;
      this.evaluated = true;
      if (st.check(c.state)) {
        c.enabled = false;
        BG.Sound.play('success');
        this.feedback('ok', st.success || t('Great!', 'Ottimo!'));
        this.$('.extra').innerHTML = '';
        this.setSolved(true);
      } else {
        BG.Sound.play('error');
        this.board.el.classList.remove('shake');
        void this.board.el.offsetWidth;
        this.board.el.classList.add('shake');
        this.feedback('bad', st.fail || t('That\'s not the move we\'re after. Try again!', 'Non è la mossa richiesta. Riprova!'));
        this.actions([
          [t('↻ Try again', '↻ Riprova'), 'btn-primary', () => { c.undoAll(); }],
          [t('Show solution', 'Mostra soluzione'), '', () => this.showSolution()],
        ]);
      }
    },

    async showSolution() {
      const st = this.stepDef;
      const start = BG.fromSpec(st.board || {});
      const sol = BG.generateTurns(start, BG.W, BG.expandDice(st.dice)).find((t) => st.check(t.state));
      if (!sol) return;
      const token = this.token;
      this.ctrl.undoAll();
      this.ctrl.enabled = false;
      this.$('.extra').innerHTML = '';
      this.feedback('info', t('Here\'s the solution: <b>', 'Ecco la soluzione: <b>') + BG.turnText(sol.moves, BG.W) + '</b>');
      await BG.delay(400);
      let s = start;
      for (const m of sol.moves) {
        if (token !== this.token) return;
        const n = BG.applyMove(s, BG.W, m);
        await this.board.animateMove(s, n, m, BG.W, 380);
        s = n;
        await BG.delay(200);
      }
      if (token !== this.token) return;
      this.setSolved(true);
      this.actions([[t('↻ Your turn', '↻ Prova tu'), '', () => this.go(this.step)]]);
    },

    complete() {
      const l = this.lesson;
      BG.progress.lessons[l.id] = true;
      BG.save();
      BG.Sound.play('win');
      const nextL = BG.LESSONS[this.idx + 1];
      this.step = this.lesson.steps.length;
      this.renderSteps();
      this.$('.panel-body').innerHTML = `<div class="complete">
        <div class="medal">🏅</div><h2>${t('Lesson complete!', 'Lezione completata!')}</h2>
        <p>${t('You completed', 'Hai completato')} <b>${l.title}</b>.<br>${BG.lessonsDone()} ${t('of', 'di')} ${BG.LESSONS.length} ${t('lessons completed.', 'lezioni completate.')}</p></div>`;
      const all = `<a class="btn btn-ghost" href="#/lessons">${t('All lessons', 'Tutte le lezioni')}</a><div class="grow"></div>`;
      this.$('.panel-foot').innerHTML = all + (nextL
        ? `<a class="btn btn-primary" href="#/lesson/${nextL.id}">${t('Next', 'Prossima')}: ${nextL.title} ›</a>`
        : `<a class="btn btn-primary" href="#/play">🎲 ${t('Play a game', 'Gioca una partita')}</a>`);
      this.solved = false;
    },
  };
})(window);
