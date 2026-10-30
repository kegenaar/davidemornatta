// Partita contro il computer, con coach che valuta le mosse.
(function (root) {
  const BG = root.BG;
  const W = BG.W;
  const B = BG.B;
  const { t } = BG;

  const CLASS_INFO = {
    migliore: { badge: '★', label: t('Best move!', 'Mossa migliore!'), fb: 'ok' },
    buona: { badge: '✓', label: t('Good move.', 'Buona mossa.'), fb: 'ok' },
    imprecisione: { badge: '?!', label: t('Inaccuracy.', 'Imprecisione.'), fb: 'info' },
    errore: { badge: '?', label: t('Mistake.', 'Errore.'), fb: 'bad' },
    forzata: { badge: '□', label: t('Forced move.', 'Mossa forzata.'), fb: 'info' },
  };
  const LEVELS = { facile: t('Easy', 'Facile'), normale: t('Normal', 'Normale') };

  BG.views.play = {
    mount(el) {
      const set = BG.settings;
      el.appendChild(BG.h(`<div class="layout play">
        <div class="board-col">
          <div class="player-bar top"><div class="avatar b"><i></i></div><span class="name">Computer</span><span class="tag lvl"></span>
            <div class="meta"><span class="chip">Pip <b class="pip-b">167</b></span><span class="chip">${t('Off', 'Fuori')} <b class="off-b">0</b></span></div></div>
          <div class="board-holder"><div id="pb"></div><div class="overlay hidden"></div></div>
          <div class="player-bar bottom"><div class="avatar w"><i></i></div><span class="name">${t('You', 'Tu')}</span>
            <div class="meta"><span class="chip">Pip <b class="pip-w">167</b></span><span class="chip">${t('Off', 'Fuori')} <b class="off-w">0</b></span></div></div>
        </div>
        <aside class="panel">
          <div class="tabs"><span>🎲 ${t('Game', 'Partita')}</span></div>
          <div class="panel-body">
            <div class="coach small">${BG.coachAvatar()}<div class="bubble msg"></div></div>
            <div class="coach-note hidden"></div>
            <div class="controls"></div>
            <div class="log"></div>
            <div class="opts">
              <label><input type="checkbox" class="switch" data-opt="showMoves"> ${t('Show possible moves', 'Mostra le mosse possibili')}</label>
              <label><input type="checkbox" class="switch" data-opt="coach"> ${t('The coach rates my moves', 'Il coach valuta le mie mosse')}</label>
              <label><input type="checkbox" class="switch" data-opt="showNumbers"> ${t('Point numbers', 'Numeri dei punti')}</label>
              <label>${t('Computer level', 'Livello computer')} <select class="level"><option value="facile">${LEVELS.facile}</option><option value="normale">${LEVELS.normale}</option></select></label>
            </div>
          </div>
          <div class="panel-foot">
            <button class="btn btn-ghost new">＋ ${t('New game', 'Nuova partita')}</button><div class="grow"></div>
            <button class="btn btn-ghost resign">⚑ ${t('Resign', 'Abbandona')}</button>
          </div>
        </aside></div>`));
      this.$ = (s) => el.querySelector(s);
      this.board = new BG.Board(this.$('#pb'), { showNumbers: set.showNumbers, showTargets: set.showMoves });

      el.querySelectorAll('[data-opt]').forEach((cb) => {
        cb.checked = !!set[cb.dataset.opt];
        cb.onchange = () => {
          set[cb.dataset.opt] = cb.checked;
          BG.save();
          this.board.opts.showNumbers = set.showNumbers;
          this.board.opts.showTargets = set.showMoves;
          this.board.render();
        };
      });
      const lvl = this.$('.level');
      lvl.value = set.level;
      lvl.onchange = () => {
        set.level = lvl.value;
        BG.save();
        this.say(t(`Level set to <b>${LEVELS[lvl.value]}</b>: it applies from the next game.`, `Livello impostato su <b>${LEVELS[lvl.value]}</b>: vale dalla prossima partita.`));
      };
      this.$('.new').onclick = () => this.newGame();
      this.$('.resign').onclick = () => {
        if (!this.g || this.g.phase === 'over' || this.g.phase === 'opening') return;
        if (confirm(t('Do you really want to resign the game?', 'Vuoi davvero abbandonare la partita?'))) this.endGame(B, true);
      };
      this.onKey = (e) => {
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
        const g = this.g;
        if (!g) return;
        if (e.code === 'Space') {
          e.preventDefault();
          if (g.phase === 'opening') this.openingRoll();
          else if (g.phase === 'roll') this.userRoll();
          else if (g.phase === 'move' && g.ctrl && g.ctrl.done) this.confirm();
        } else if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'Backspace') {
          if (g.phase === 'move' && g.ctrl) g.ctrl.undo();
        } else if (e.key === 'h' || e.key === 'H') {
          if (g.phase === 'move') this.hint();
        }
      };
      document.addEventListener('keydown', this.onKey);
      this.newGame();
    },

    unmount() {
      document.removeEventListener('keydown', this.onKey);
      this.g = null;
    },

    say(html, kind) {
      const ico = kind ? `<span class="badge ${kind}">${CLASS_INFO[kind].badge}</span> ` : '';
      this.$('.msg').innerHTML = ico + html;
    },

    // Commento del coach (valutazione o suggerimento): resta visibile finché
    // non ne arriva un altro, così non viene coperto dai messaggi di gioco.
    note(html, kind, title) {
      const box = this.$('.coach-note');
      if (!html) { box.classList.add('hidden'); return; }
      const ico = kind ? `<span class="badge ${kind}">${CLASS_INFO[kind].badge}</span>` : '💡';
      box.innerHTML = `<div class="note-head">${ico}<span>${title}</span></div><div>${html}</div>`;
      box.classList.remove('hidden');
    },

    alive(g) { return this.g === g; },

    newGame() {
      if (this.g && this.g.ctrl) this.g.ctrl.detach();
      const g = { state: BG.initialState(), phase: 'opening', log: [], level: BG.settings.level, ctrl: null };
      this.g = g;
      this.$('.lvl').textContent = LEVELS[g.level];
      this.$('.overlay').classList.add('hidden');
      this.board.interaction = null;
      this.board.set({ state: g.state, dice: [], lastMove: [], arrows: [], highlights: [], selected: null, targets: [] });
      this.note(null);
      this.say(t('New game! You play <b>white</b>. To decide who starts, each of you rolls one die: the higher number goes first.',
        'Nuova partita! Tu hai le <b>bianche</b>. Per decidere chi inizia, ognuno lancia un dado: chi fa il numero più alto comincia.'));
      this.renderAll();
    },

    renderAll() {
      const g = this.g;
      const s = g.ctrl && g.phase === 'move' ? g.ctrl.state : g.state;
      this.$('.pip-w').textContent = BG.pipCount(s, W);
      this.$('.pip-b').textContent = BG.pipCount(s, B);
      this.$('.off-w').textContent = s.off.w;
      this.$('.off-b').textContent = s.off.b;
      this.$('.player-bar.bottom').classList.toggle('turn', ['roll', 'move'].includes(g.phase));
      this.$('.player-bar.top').classList.toggle('turn', g.phase === 'ai');
      this.renderControls();
      this.renderLog();
    },

    renderControls() {
      const g = this.g;
      const box = this.$('.controls');
      box.innerHTML = '';
      const btn = (label, cls, fn, disabled) => {
        const b = BG.h(`<button class="btn ${cls}">${label}</button>`);
        b.onclick = fn;
        b.disabled = !!disabled;
        return b;
      };
      if (g.phase === 'opening') {
        box.appendChild(btn(`🎲 ${t('Roll to start', 'Lancia per iniziare')} <kbd>${t('Space', 'Spazio')}</kbd>`, 'btn-primary btn-big', () => this.openingRoll()));
      } else if (g.phase === 'roll') {
        box.appendChild(btn(`🎲 ${t('Roll the dice', 'Lancia i dadi')} <kbd>${t('Space', 'Spazio')}</kbd>`, 'btn-primary btn-big', () => this.userRoll()));
      } else if (g.phase === 'move') {
        const c = g.ctrl;
        if (c.noMovesAtAll) {
          box.appendChild(btn(t('Pass the turn ›', 'Passa il turno ›'), 'btn-primary btn-big', () => this.confirm()));
        } else {
          box.appendChild(btn(`✓ ${t('Confirm move', 'Conferma mossa')} <kbd>${t('Space', 'Spazio')}</kbd>`, 'btn-primary btn-big', () => this.confirm(), !c.done));
          const row = BG.h('<div class="row"></div>');
          row.appendChild(btn(t('↶ Undo', '↶ Annulla'), '', () => c.undo(), !c.history.length));
          row.appendChild(btn(`💡 ${t('Hint', 'Suggerimento')}`, '', () => this.hint(), c.done));
          box.appendChild(row);
        }
      } else if (g.phase === 'ai') {
        box.appendChild(BG.h(`<div class="thinking"><span class="dots"><i></i><i></i><i></i></span> ${t('The computer is playing…', 'Il computer sta giocando…')}</div>`));
      } else if (g.phase === 'over') {
        box.appendChild(btn(`＋ ${t('New game', 'Nuova partita')}`, 'btn-primary btn-big', () => this.newGame()));
      }
    },

    renderLog() {
      const g = this.g;
      const log = this.$('.log');
      if (!g.log.length) {
        log.innerHTML = `<div class="log-empty">${t('The game\'s moves will appear here.', 'Le mosse della partita appariranno qui.')}</div>`;
        return;
      }
      log.innerHTML = g.log.map((e, i) => {
        const badge = e.cls ? `<span class="badge ${e.cls}" title="${CLASS_INFO[e.cls].label}">${CLASS_INFO[e.cls].badge}</span>` : '';
        return `<div class="log-row"><span class="n">${i + 1}.</span><span class="dot ${e.player}"></span><span class="dc">${e.dice.join('-')}</span><span class="mv">${BG.turnText(e.moves, e.player)}</span>${badge}</div>`;
      }).join('');
      log.scrollTop = log.scrollHeight;
    },

    async openingRoll() {
      const g = this.g;
      if (g.phase !== 'opening' || g.rolling) return;
      g.rolling = true;
      const u = BG.rollDie();
      const c = BG.rollDie();
      BG.Sound.play('dice');
      this.board.set({ dice: [{ values: [u], player: W }, { values: [c], player: B }] });
      if (u === c) {
        this.say(t(`You both rolled <b>${u}</b>: it's a tie, roll again!`, `Avete fatto entrambi <b>${u}</b>: pareggio, si rilancia!`));
        g.rolling = false;
        return;
      }
      g.phase = 'wait';
      this.renderControls();
      if (u > c) {
        this.say(t(`You <b>${u}</b>, computer <b>${c}</b>: <b>you go first</b> and play ${u}-${c}!`, `Tu <b>${u}</b>, computer <b>${c}</b>: <b>inizi tu</b> e giochi ${u}-${c}!`));
        await BG.delay(900);
        if (this.alive(g)) this.startUserTurn([u, c]);
      } else {
        this.say(t(`Computer <b>${c}</b>, you <b>${u}</b>: the computer goes first, playing ${c}-${u}.`, `Computer <b>${c}</b>, tu <b>${u}</b>: inizia il computer giocando ${c}-${u}.`));
        await BG.delay(1100);
        if (this.alive(g)) this.aiTurn([c, u]);
      }
    },

    userRoll() {
      const g = this.g;
      if (g.phase !== 'roll') return;
      BG.Sound.play('dice');
      this.startUserTurn([BG.rollDie(), BG.rollDie()]);
    },

    startUserTurn(dice) {
      const g = this.g;
      g.phase = 'move';
      g.dice = dice;
      g.turnStart = g.state;
      this.board.set({ arrows: [] });
      g.ctrl = new BG.TurnController(this.board, { state: g.state, dice, onChange: () => this.alive(g) && g.ctrl && this.renderAll(),
        onReject: (msg) => this.alive(g) && this.say(`✋ ${msg}`),
      });
      if (g.ctrl.noMovesAtAll) {
        const why = g.state.bar.w ? t(': you can\'t enter from the bar', ': non riesci a rientrare dalla barra') : '';
        this.say(t(`You rolled <b>${dice.join('-')}</b> but there's no legal move${why}. The turn passes to the computer.`,
          `Hai tirato <b>${dice.join('-')}</b> ma non esiste nessuna mossa possibile${why}. Il turno passa al computer.`));
      } else {
        const dbl = dice[0] === dice[1] ? t(' It\'s a <b>double</b>: you have four moves!', ' È un <b>doppio</b>: hai quattro mosse!') : '';
        const bar = g.state.bar.w ? t(' First you must <b>enter</b> your checker from the bar.', ' Prima devi far <b>rientrare</b> la pedina dalla barra.') : '';
        this.say(t(`You rolled <b>${dice.join('-')}</b>.${dbl}${bar} Click or drag a checker.`, `Hai tirato <b>${dice.join('-')}</b>.${dbl}${bar} Clicca o trascina una pedina.`));
      }
      this.renderAll();
    },

    hint() {
      const g = this.g;
      if (g.phase !== 'move' || !g.ctrl || g.ctrl.done) return;
      const c = g.ctrl;
      const best = BG.rankTurns(c.state, W, c.remaining)[0];
      if (!best) return;
      c.clear();
      this.board.set({ arrows: best.moves.map((m) => ({ from: c.fromLoc(m), to: c.toLoc(m), color: 'hint' })) });
      const mv = BG.turnText(best.moves, W);
      this.note(t(`I would play <b>${mv}</b>. Follow the blue arrows on the board.`, `Io giocherei <b>${mv}</b>. Segui le frecce blu sul tabellone.`), null, t('Hint', 'Suggerimento'));
    },

    confirm() {
      const g = this.g;
      if (g.phase !== 'move') return;
      const c = g.ctrl;
      if (!c.done) return;
      c.detach();
      g.ctrl = null;
      g.state = c.state;
      const entry = { player: W, dice: g.dice, moves: c.moves };
      if (BG.settings.coach && c.moves.length) {
        const r = BG.classify(g.turnStart, W, BG.expandDice(g.dice), g.state);
        entry.cls = r.kind;
        const info = CLASS_INFO[r.kind];
        const better = r.best && r.kind !== 'forzata' && r.kind !== 'migliore'
          ? BG.compareMoves(g.turnStart, g.state, r.best.state, W) : [];
        const withBest = better.length ? t(`: that way ${better.slice(0, 2).join(' and ')}`, `: così ${better.slice(0, 2).join(' e ')}`) : '';
        const bestText = r.best ? BG.turnText(r.best.moves, W) : '';
        let msg = '';
        if (r.kind === 'imprecisione' || r.kind === 'errore') {
          msg = t(`The best move was <b>${bestText}</b>`, `La mossa migliore era <b>${bestText}</b>`) + (withBest || `. ${r.reason.replace(/\.$/, '')}`) + '.';
        } else if (r.kind === 'forzata') {
          msg = t('There were no alternatives.', 'Non c\'erano alternative.');
        } else if (r.kind === 'buona') {
          msg = t(`Fine! The coach would have played ${bestText}${withBest}.`, `Va bene! Il coach avrebbe giocato ${bestText}${withBest}.`);
        } else {
          msg = t('That\'s exactly the move I would have chosen.', 'È proprio la mossa che avrei scelto io.');
        }
        const tips = BG.describeMove(g.turnStart, g.state, W, c.moves).slice(0, 3);
        if (tips.length) {
          msg += `<ul class="insights">${tips.map((t) => `<li class="${t.tone}"><span class="ico">${t.icon}</span><span>${t.html}</span></li>`).join('')}</ul>`;
        }
        this.note(msg, r.kind, `${info.label.replace(/[.!]$/, '')} · ${BG.turnText(c.moves, W)}`);
      } else {
        this.note(null);
      }
      this.say(c.moves.length ? t('Move played. Now it\'s the computer\'s turn.', 'Mossa giocata. Ora tocca al computer.') : t('Turn passed.', 'Turno passato.'));
      g.log.push(entry);
      this.board.set({ arrows: [], lastMove: this.moveLocs(c.moves, W) });
      if (BG.winner(g.state)) return this.endGame(W);
      this.aiTurn();
    },

    moveLocs(moves, player) {
      const locs = new Set();
      for (const m of moves) {
        locs.add(m.from === BG.barPoint(player) ? 'bar' : m.from);
        locs.add(m.to === BG.offPoint(player) ? 'off' : m.to);
      }
      locs.delete('off');
      return [...locs];
    },

    async aiTurn(dice) {
      const g = this.g;
      g.phase = 'ai';
      this.board.interaction = null;
      this.renderAll();
      await BG.delay(dice ? 300 : 700);
      if (!this.alive(g)) return;
      if (!dice) {
        dice = [BG.rollDie(), BG.rollDie()];
        BG.Sound.play('dice');
      }
      const values = BG.expandDice(dice);
      const shown = dice[0] === dice[1] ? values : dice.slice();
      const used = shown.map(() => false);
      this.board.set({ dice: [{ values: shown, used, player: B }] });
      await BG.delay(700);
      if (!this.alive(g)) return;
      const choice = BG.chooseTurn(g.state, B, values, g.level);
      const moves = choice ? choice.moves : [];
      if (!moves.length) {
        this.say(t(`The computer rolled <b>${dice.join('-')}</b> and can't move.`, `Il computer ha tirato <b>${dice.join('-')}</b> e non può muovere.`) +
          (g.state.bar.b ? t(' It can\'t enter from the bar!', ' Non riesce a rientrare dalla barra!') : ''));
        await BG.delay(900);
      }
      let s = g.state;
      for (const m of moves) {
        const n = BG.applyMove(s, B, m);
        const k = dice[0] === dice[1] ? used.indexOf(false) : shown.findIndex((v, i) => v === m.die && !used[i]);
        used[k] = true;
        this.board.dice = [{ values: shown, used, player: B }];
        await this.board.animateMove(s, n, m, B, 320);
        if (!this.alive(g)) return;
        s = n;
        await BG.delay(260);
      }
      g.state = s;
      g.log.push({ player: B, dice, moves });
      this.board.set({ lastMove: this.moveLocs(moves, B) });
      if (moves.some((m) => m.hit)) this.say(t('The computer <b>hit</b> one of your checkers: you\'ll have to bring it in from the bar.', 'Il computer ha <b>colpito</b> una tua pedina: dovrai farla rientrare dalla barra.'));
      if (BG.winner(g.state)) return this.endGame(B);
      g.phase = 'roll';
      this.renderAll();
    },

    endGame(winner, resigned) {
      const g = this.g;
      if (g.ctrl) { g.ctrl.detach(); g.ctrl = null; }
      g.phase = 'over';
      const value = resigned ? 1 : BG.resultValue(g.state, winner);
      const type = { 1: t('Single win', 'Vittoria semplice'), 2: 'Gammon', 3: 'Backgammon' }[value];
      const st = BG.progress.stats;
      st.games++;
      if (winner === W) { st.wins++; st.points += value; } else st.losses++;
      BG.save();
      const won = winner === W;
      BG.Sound.play(won ? 'win' : 'lose');
      const ov = this.$('.overlay');
      ov.innerHTML = `<div class="modal">
        <div class="modal-head ${won ? '' : 'lose'}"><div class="big">${won ? '🏆' : '🎲'}</div>
          <h2>${won ? t('You won!', 'Hai vinto!') : resigned ? t('You resigned', 'Hai abbandonato') : t('The computer won', 'Ha vinto il computer')}</h2>
          <p>${resigned ? t('Game resigned', 'Partita abbandonata') : `${type} · ${value} ${value === 1 ? t('point', 'punto') : t('points', 'punti')}`}</p></div>
        <div class="modal-body">
          <button class="btn btn-primary btn-big again">${t('New game', 'Nuova partita')}</button>
          <button class="btn btn-ghost view">${t('Look at the board', 'Guarda il tabellone')}</button>
          <p class="eyebrow" style="margin:6px 0 0">${t('Record', 'Bilancio')}: ${st.wins} ${t('wins', 'vittorie')} · ${st.losses} ${t('losses', 'sconfitte')}</p>
        </div></div>`;
      ov.classList.remove('hidden');
      ov.querySelector('.again').onclick = () => this.newGame();
      ov.querySelector('.view').onclick = () => ov.classList.add('hidden');
      const gammon = value > 1 && !resigned ? t(': your opponent hadn\'t borne off a single checker', ': l\'avversario non aveva fatto uscire nessuna pedina') : '';
      this.say(won
        ? t(`Congratulations! ${type}${gammon}. You can play backgammon! 🎉`, `Complimenti! ${type}${gammon}. Sai giocare a backgammon! 🎉`)
        : t('Don\'t worry: every game teaches you something. Try using the <b>hint</b> when you\'re unsure.', 'Non preoccuparti: ogni partita ti insegna qualcosa. Prova a usare il <b>suggerimento</b> quando hai dubbi.'));
      this.renderAll();
    },
  };
})(window);
