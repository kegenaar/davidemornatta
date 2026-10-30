// Avversario e coach: valutazione euristica semplice delle posizioni.
(function (root) {
  const BG = root.BG;

  const POINT_VALUE = [0, 1.5, 2, 3, 4, 5, 4, 4, 2.5, 1, 1, 1, 0.5];

  // Vista della posizione dal punto di vista di `player`:
  // me[i] = mie pedine a distanza i dall'uscita; op[i] = pedine avversarie sullo stesso punto.
  function perspective(s, player) {
    const me = new Array(26).fill(0);
    const op = new Array(26).fill(0);
    for (let p = 1; p <= 24; p++) {
      const v = s.pts[p];
      const i = player === BG.W ? p : 25 - p;
      const mine = player === BG.W ? v > 0 : v < 0;
      if (v !== 0) (mine ? me : op)[i] = Math.abs(v);
    }
    return { me, op, myBar: s.bar[player], opBar: s.bar[BG.opp(player)] };
  }

  // Probabilità approssimativa che una pedina scoperta in posizione i venga colpita.
  function shotChance(v, i) {
    let miss = 1;
    const check = (k) => {
      if (k >= 1 && k <= 6) miss *= 1 - 0.31;
      else if (k >= 7 && k <= 12) miss *= 1 - 0.09;
    };
    if (v.opBar > 0) check(i);
    for (let q = 1; q < i; q++) if (v.op[q] > 0) check(i - q);
    return 1 - miss;
  }

  function blots(s, player) {
    const v = perspective(s, player);
    const res = [];
    for (let i = 1; i <= 24; i++) {
      if (v.me[i] === 1) {
        const chance = shotChance(v, i);
        if (chance > 0) res.push({ point: player === BG.W ? i : 25 - i, chance, i });
      }
    }
    return res;
  }

  function evaluate(s, player) {
    const o = BG.opp(player);
    const v = perspective(s, player);
    const myPip = BG.pipCount(s, player);
    const opPip = BG.pipCount(s, o);
    let score = (opPip - myPip) + s.off[player] * 2;

    let myRear = v.myBar ? 25 : 0;
    for (let i = 24; i >= 1 && !myRear; i--) if (v.me[i]) myRear = i;
    let opRear = v.opBar ? 0 : 25;
    for (let i = 1; i <= 24 && opRear === 25 && !v.opBar; i++) if (v.op[i]) opRear = i;
    const contact = myRear > opRear;
    if (!contact) return score + s.off[player] * 2;

    score += v.opBar * 10;

    let run = 0;
    let bestRun = 0;
    let anchor = false;
    for (let i = 1; i <= 24; i++) {
      const n = v.me[i];
      if (n >= 2) {
        const behind = v.opBar > 0 || v.op.slice(1, i).some((x) => x > 0);
        if (behind) score += i <= 12 ? POINT_VALUE[i] : 0.5;
        if (i >= 19) anchor = true;
        run = behind ? run + 1 : 0;
        bestRun = Math.max(bestRun, run);
      } else {
        run = 0;
      }
      if (n === 1) {
        const c = shotChance(v, i);
        score -= c * (25 - i + 8);
      }
      if (n > 3) score -= (n - 3) * 1;
    }
    if (bestRun >= 3) score += (bestRun - 2) * 4;
    if (anchor) score += 3;
    return score;
  }

  function rankTurns(s, player, dice) {
    return BG.generateTurns(s, player, dice)
      .map((t) => ({ ...t, score: evaluate(t.state, player) }))
      .sort((a, b) => b.score - a.score);
  }

  function chooseTurn(s, player, dice, level) {
    const ranked = rankTurns(s, player, dice);
    if (!ranked.length) return null;
    if (level === 'facile') {
      if (Math.random() < 0.4) return ranked[Math.floor(Math.random() * ranked.length)];
      return ranked[Math.floor(Math.random() * Math.min(3, ranked.length))];
    }
    return ranked[0];
  }

  // Classifica la mossa dell'utente in stile "coach".
  function classify(before, player, dice, afterState) {
    const ranked = rankTurns(before, player, dice);
    if (ranked.length <= 1) return { kind: 'forzata', best: ranked[0] || null };
    const key = BG.stateKey(afterState);
    const mine = ranked.find((t) => BG.stateKey(t.state) === key);
    const best = ranked[0];
    if (!mine) return { kind: 'buona', best };
    const delta = best.score - mine.score;
    let kind = 'errore';
    if (delta <= 0.5) kind = 'migliore';
    else if (delta <= 4) kind = 'buona';
    else if (delta <= 10) kind = 'imprecisione';

    let reason = '';
    if (kind === 'imprecisione' || kind === 'errore') {
      const o = BG.opp(player);
      const myBlots = blots(mine.state, player).filter((b) => b.chance > 0.3);
      const bestBlots = blots(best.state, player).filter((b) => b.chance > 0.3);
      if (best.state.bar[o] > mine.state.bar[o]) {
        reason = BG.t('You could have hit an opposing checker and sent it back.', 'Potevi colpire una pedina avversaria e rimandarla indietro.');
      } else if (myBlots.length > bestBlots.length) {
        const worst = myBlots.sort((a, b) => b.chance - a.chance)[0];
        reason = BG.t(`Your blot on point ${worst.point} is easy to hit.`, `La tua pedina scoperta sul punto ${worst.point} è facile da colpire.`);
      } else if (homePoints(best.state, player) > homePoints(mine.state, player)) {
        reason = BG.t('You could have made one more point in your home board.', 'Potevi costruire un punto in più nella tua casa.');
      } else {
        reason = BG.t('The suggested move keeps your checkers safer.', 'La mossa suggerita tiene le pedine più al sicuro.');
      }
    }
    return { kind, best, mine, delta, reason };
  }

  function homePoints(s, player) {
    let n = 0;
    for (let i = 1; i <= 7; i++) {
      const p = player === BG.W ? i : 25 - i;
      if (BG.count(s, p, player) >= 2) n++;
    }
    return n;
  }

  Object.assign(BG, { evaluate, rankTurns, chooseTurn, classify, blots });
  if (typeof module !== 'undefined') module.exports = BG;
})(typeof window !== 'undefined' ? window : globalThis);
