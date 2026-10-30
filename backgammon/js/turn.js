// Gestisce il turno interattivo dell'utente: selezione, destinazioni, annulla.
(function (root) {
  const BG = root.BG;

  class TurnController {
    constructor(board, { state, player = BG.W, dice, onChange, onReject }) {
      this.board = board;
      this.player = player;
      this.startState = state;
      this.state = state;
      this.dice = dice;
      this.remaining = BG.expandDice(dice);
      this.history = [];
      this.moves = [];
      this.onChange = onChange || (() => {});
      this.onReject = onReject || (() => {});
      this.enabled = true;
      this.selected = null;
      this.targetPaths = new Map();
      this._refresh();
      board.interaction = this;
      this._sync();
    }

    get done() { return this.legal.length === 0; }
    get noMovesAtAll() { return this.history.length === 0 && this.legal.length === 0; }

    fromLoc(m) { return m.from === BG.barPoint(this.player) ? 'bar' : m.from; }
    toLoc(m) { return m.to === BG.offPoint(this.player) ? 'off' : m.to; }

    _refresh() {
      this.legal = BG.legalMoves(this.state, this.player, this.remaining);
    }

    diceView() {
      const values = BG.expandDice(this.dice);
      let used;
      if (values.length === 4) {
        const nUsed = 4 - this.remaining.length;
        used = values.map((_, i) => i < nUsed);
      } else {
        used = values.map((v) => !this.remaining.includes(v));
      }
      return { values: this.dice[0] === this.dice[1] ? values : this.dice.slice(), used, player: this.player };
    }

    _sync() {
      const targets = [];
      for (const [loc, path] of this.targetPaths) targets.push({ loc, hit: path[path.length - 1].hit, player: this.player });
      this.board.set({ state: this.state, selected: this.selected, targets, dice: [this.diceView()] });
      this.onChange(this);
    }

    canPick(loc) {
      return this.enabled && this.legal.some((m) => this.fromLoc(m) === loc);
    }

    pick(loc) {
      this.selected = loc;
      this.targetPaths = this._computeTargets(loc);
      this.board.arrows = [];
      this._sync();
    }

    // Click o trascinamento non valido: spiega il motivo.
    // from = pedina selezionata (o null se l'utente ha cliccato una pedina non movibile).
    reject(loc, from) {
      if (!this.enabled || this.done) return;
      const msg = from != null
        ? BG.explainDrop(this.state, this.player, this.remaining, from, loc)
        : BG.explainPick(this.state, this.player, this.remaining, loc);
      if (msg) this.onReject(msg);
    }

    clear() {
      if (this.selected == null) return;
      this.selected = null;
      this.targetPaths = new Map();
      this._sync();
    }

    // Destinazioni raggiungibili dalla pedina selezionata, anche usando più dadi.
    _computeTargets(loc) {
      const res = new Map();
      const hits = (path) => path.filter((m) => m.hit).length;
      let frontier = [{ state: this.state, rem: this.remaining, loc, path: [] }];
      while (frontier.length) {
        const next = [];
        for (const node of frontier) {
          const moves = BG.legalMoves(node.state, this.player, node.rem)
            .filter((m) => this.fromLoc(m) === node.loc)
            .sort((a, b) => a.die - b.die);
          for (const m of moves) {
            const t = this.toLoc(m);
            const path = node.path.concat([m]);
            const prev = res.get(t);
            if (!prev || (prev.length === path.length && hits(path) > hits(prev))) res.set(t, path);
            if (t !== 'off' && node.rem.length > 1) {
              next.push({ state: BG.applyMove(node.state, this.player, m), rem: BG.removeDie(node.rem, m.die), loc: t, path });
            }
          }
        }
        frontier = next;
      }
      return res;
    }

    async drop(loc, animate) {
      const path = this.targetPaths.get(loc);
      if (!path || !this.enabled) return;
      this.selected = null;
      this.targetPaths = new Map();
      this.board.selected = null;
      this.board.targets = [];
      for (const m of path) await this.applyMove(m, animate);
    }

    async applyMove(m, animate = true) {
      const before = this.state;
      const after = BG.applyMove(before, this.player, m);
      this.history.push({ state: before, remaining: this.remaining });
      this.moves.push(m);
      this.state = after;
      this.remaining = BG.removeDie(this.remaining, m.die);
      this._refresh();
      this.board.dice = [this.diceView()];
      if (animate) {
        this.enabled = false;
        await this.board.animateMove(before, after, m, this.player);
        this.enabled = true;
      } else {
        BG.Sound.play(m.hit ? 'hit' : 'move');
      }
      this.board.lastMove = [];
      this._sync();
    }

    undo() {
      const h = this.history.pop();
      if (!h) return;
      this.moves.pop();
      this.state = h.state;
      this.remaining = h.remaining;
      this.selected = null;
      this.targetPaths = new Map();
      this._refresh();
      this._sync();
    }

    undoAll() {
      while (this.history.length) this.undo();
    }

    detach() {
      this.enabled = false;
      if (this.board.interaction === this) this.board.interaction = null;
      this.board.set({ selected: null, targets: [] });
    }
  }

  BG.TurnController = TurnController;
})(window);
