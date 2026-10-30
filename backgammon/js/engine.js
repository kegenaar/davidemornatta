// Motore delle regole del backgammon.
// Rappresentazione: pts[1..24] con interi con segno (+ = bianco, - = nero).
// Il bianco (giocatore umano) muove dal 24 verso l'1 ed esce "sotto" l'1.
// Il nero muove dall'1 verso il 24 ed esce "sopra" il 24.
// Nelle mosse: per il bianco from=25 indica la barra e to=0 l'uscita;
// per il nero from=0 indica la barra e to=25 l'uscita.
(function (root) {
  const BG = (root.BG = root.BG || {});
  const W = 'w';
  const B = 'b';
  const opp = (p) => (p === W ? B : W);

  function emptyState() {
    return { pts: new Array(26).fill(0), bar: { w: 0, b: 0 }, off: { w: 0, b: 0 } };
  }

  function initialState() {
    return fromSpec({
      w: { 24: 2, 13: 5, 8: 3, 6: 5 },
      b: { 1: 2, 12: 5, 17: 3, 19: 5 },
    });
  }

  // spec: { w: {punto: n}, b: {punto: n}, bar: {w, b}, off: {w, b} }
  function fromSpec(spec) {
    const s = emptyState();
    for (const [p, n] of Object.entries(spec.w || {})) s.pts[+p] += n;
    for (const [p, n] of Object.entries(spec.b || {})) s.pts[+p] -= n;
    if (spec.bar) Object.assign(s.bar, spec.bar);
    if (spec.off) Object.assign(s.off, spec.off);
    return s;
  }

  function clone(s) {
    return { pts: s.pts.slice(), bar: { ...s.bar }, off: { ...s.off } };
  }

  function stateKey(s) {
    return s.pts.join(',') + '|' + s.bar.w + ',' + s.bar.b + '|' + s.off.w + ',' + s.off.b;
  }

  function count(s, p, player) {
    const v = s.pts[p];
    return player === W ? (v > 0 ? v : 0) : v < 0 ? -v : 0;
  }

  const barPoint = (player) => (player === W ? 25 : 0);
  const offPoint = (player) => (player === W ? 0 : 25);
  const entryPoint = (player, die) => (player === W ? 25 - die : die);

  function allHome(s, player) {
    if (s.bar[player]) return false;
    if (player === W) {
      for (let p = 7; p <= 24; p++) if (s.pts[p] > 0) return false;
    } else {
      for (let p = 1; p <= 18; p++) if (s.pts[p] < 0) return false;
    }
    return true;
  }

  // Tutte le mosse singole possibili con un dado (senza le regole sull'uso dei dadi).
  function singleMoves(s, player, die) {
    const moves = [];
    const o = opp(player);
    if (s.bar[player] > 0) {
      const to = entryPoint(player, die);
      const oc = count(s, to, o);
      if (oc < 2) moves.push({ from: barPoint(player), to, die, hit: oc === 1 });
      return moves;
    }
    const canOff = allHome(s, player);
    for (let p = 1; p <= 24; p++) {
      if (count(s, p, player) === 0) continue;
      const t = player === W ? p - die : p + die;
      if (t >= 1 && t <= 24) {
        const oc = count(s, t, o);
        if (oc < 2) moves.push({ from: p, to: t, die, hit: oc === 1 });
      } else if (canOff) {
        const dist = player === W ? p : 25 - p;
        if (dist === die) {
          moves.push({ from: p, to: offPoint(player), die, hit: false });
        } else if (dist < die) {
          let farther = false;
          if (player === W) {
            for (let q = p + 1; q <= 6; q++) if (s.pts[q] > 0) { farther = true; break; }
          } else {
            for (let q = p - 1; q >= 19; q--) if (s.pts[q] < 0) { farther = true; break; }
          }
          if (!farther) moves.push({ from: p, to: offPoint(player), die, hit: false });
        }
      }
    }
    return moves;
  }

  function applyMove(s, player, m) {
    const n = clone(s);
    const sign = player === W ? 1 : -1;
    if (m.from === barPoint(player)) n.bar[player]--;
    else n.pts[m.from] -= sign;
    if (m.to === offPoint(player)) {
      n.off[player]++;
    } else {
      if (m.hit) {
        n.pts[m.to] = 0;
        n.bar[opp(player)]++;
      }
      n.pts[m.to] += sign;
    }
    return n;
  }

  const expandDice = (dice) => (dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : [dice[0], dice[1]]);

  function removeDie(list, die) {
    const i = list.indexOf(die);
    return list.slice(0, i).concat(list.slice(i + 1));
  }

  // Numero massimo di dadi utilizzabili da questa posizione.
  function maxPlayable(s, player, dice, memo) {
    if (!dice.length) return 0;
    const key = stateKey(s) + '#' + dice.join('');
    if (memo.has(key)) return memo.get(key);
    let best = 0;
    const tried = new Set();
    for (let i = 0; i < dice.length && best < dice.length; i++) {
      const d = dice[i];
      if (tried.has(d)) continue;
      tried.add(d);
      const rest = removeDie(dice, d);
      for (const m of singleMoves(s, player, d)) {
        const v = 1 + maxPlayable(applyMove(s, player, m), player, rest, memo);
        if (v > best) best = v;
        if (best === dice.length) break;
      }
    }
    memo.set(key, best);
    return best;
  }

  // Mosse singole legali ora, tenendo conto dell'obbligo di usare
  // il massimo numero di dadi (e il dado più alto se se ne può usare uno solo).
  function legalMoves(s, player, dice) {
    const memo = new Map();
    const total = maxPlayable(s, player, dice, memo);
    if (total === 0) return [];
    let res = [];
    const tried = new Set();
    for (const d of dice) {
      if (tried.has(d)) continue;
      tried.add(d);
      const rest = removeDie(dice, d);
      for (const m of singleMoves(s, player, d)) {
        if (1 + maxPlayable(applyMove(s, player, m), player, rest, memo) === total) res.push(m);
      }
    }
    if (total === 1 && dice.length === 2 && dice[0] !== dice[1]) {
      const hi = Math.max(dice[0], dice[1]);
      if (res.some((m) => m.die === hi)) res = res.filter((m) => m.die === hi);
    }
    return res;
  }

  // Tutti i turni completi legali, con posizioni finali distinte.
  function generateTurns(s, player, dice) {
    const leaves = [];
    const visited = new Set();
    function rec(st, rem, moves) {
      const key = stateKey(st) + '#' + rem.slice().sort().join('');
      if (visited.has(key)) return;
      visited.add(key);
      let any = false;
      const tried = new Set();
      for (const d of rem) {
        if (tried.has(d)) continue;
        tried.add(d);
        const rest = removeDie(rem, d);
        for (const m of singleMoves(st, player, d)) {
          any = true;
          rec(applyMove(st, player, m), rest, moves.concat([m]));
        }
      }
      if (!any) leaves.push({ moves, state: st });
    }
    rec(s, dice, []);
    const maxLen = leaves.reduce((a, l) => Math.max(a, l.moves.length), 0);
    let legal = leaves.filter((l) => l.moves.length === maxLen);
    if (maxLen === 1 && dice.length === 2 && dice[0] !== dice[1]) {
      const hi = Math.max(dice[0], dice[1]);
      if (legal.some((l) => l.moves[0].die === hi)) legal = legal.filter((l) => l.moves[0].die === hi);
    }
    const out = new Map();
    for (const l of legal) {
      const k = stateKey(l.state);
      if (!out.has(k)) out.set(k, l);
    }
    return [...out.values()];
  }

  function pipCount(s, player) {
    let pip = s.bar[player] * 25;
    for (let p = 1; p <= 24; p++) {
      const c = count(s, p, player);
      if (c) pip += c * (player === W ? p : 25 - p);
    }
    return pip;
  }

  function winner(s) {
    if (s.off.w === 15) return W;
    if (s.off.b === 15) return B;
    return null;
  }

  // 1 = vittoria semplice, 2 = gammon, 3 = backgammon
  function resultValue(s, win) {
    const lose = opp(win);
    if (s.off[lose] > 0) return 1;
    if (s.bar[lose] > 0) return 3;
    const home = win === W ? [1, 6] : [19, 24];
    for (let p = home[0]; p <= home[1]; p++) if (count(s, p, lose) > 0) return 3;
    return 2;
  }

  // Notazione: i punti sono sempre numerati dal punto di vista del bianco
  // (come appaiono sul tabellone).
  function moveText(m, player) {
    const from = m.from === barPoint(player) ? BG.t('bar', 'barra') : String(m.from);
    const to = m.to === offPoint(player) ? BG.t('off', 'fuori') : String(m.to);
    return from + '/' + to + (m.hit ? '*' : '');
  }

  function turnText(moves, player) {
    if (!moves.length) return BG.t('no move', 'nessuna mossa');
    const parts = [];
    const counts = new Map();
    for (const m of moves) {
      const t = moveText(m, player);
      if (!counts.has(t)) parts.push(t);
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return parts.map((t) => (counts.get(t) > 1 ? t + '(' + counts.get(t) + ')' : t)).join(' ');
  }

  const rollDie = () => 1 + Math.floor(Math.random() * 6);

  Object.assign(BG, {
    W, B, opp, emptyState, initialState, fromSpec, clone, stateKey, count,
    barPoint, offPoint, entryPoint, allHome, singleMoves, applyMove, expandDice,
    removeDie, legalMoves, generateTurns, pipCount, winner, resultValue,
    moveText, turnText, rollDie,
  });
  if (typeof module !== 'undefined') module.exports = BG;
})(typeof window !== 'undefined' ? window : globalThis);
