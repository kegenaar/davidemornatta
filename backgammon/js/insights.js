// Osservazioni tattiche del coach dopo una mossa: colpi, punti, blocchi,
// pedine scoperte (con i tiri che le colpiscono), barra, retrovie, corsa.
(function (root) {
  const BG = root.BG;

  // Vista dal punto di vista di `player`: indice i = distanza dall'uscita (1..24).
  function view(s, player) {
    const me = new Array(26).fill(0);
    const op = new Array(26).fill(0);
    for (let p = 1; p <= 24; p++) {
      const v = s.pts[p];
      if (!v) continue;
      const i = player === BG.W ? p : 25 - p;
      const mine = player === BG.W ? v > 0 : v < 0;
      (mine ? me : op)[i] = Math.abs(v);
    }
    return { me, op, myBar: s.bar[player], opBar: s.bar[BG.opp(player)] };
  }

  const { t } = BG;
  const pointOf = (player, i) => (player === BG.W ? i : 25 - i);
  // Articolo davanti a un numero: "l'8%", "l'11%", "il 56%".
  const art = (n) => (/^(8|11$|11\d)/.test(String(n)) ? `l'${n}` : `il ${n}`);
  const pct = (n) => Math.round((n / 36) * 100);
  const tiri = (n) => (n === 1 ? t('1 roll', '1 tiro') : t(`${n} rolls`, `${n} tiri`));
  const pedine = (n) => (n === 1 ? t('1 checker', '1 pedina') : t(`${n} checkers`, `${n} pedine`));

  // L'avversario muove verso indici più alti (dal mio punto di vista) partendo da j (0 = barra).
  // Può colpire la pedina in i con il tiro (d1, d2)?
  function canHit(v, j, i, d1, d2) {
    const dist = i - j;
    if (dist <= 0) return false;
    const open = (k) => v.me[k] < 2;
    if (d1 !== d2) {
      if (d1 === dist || d2 === dist) return true;
      return d1 + d2 === dist && (open(j + d1) || open(j + d2));
    }
    for (let k = 1; k <= 4; k++) {
      if (d1 * k > dist) return false;
      if (!open(j + d1 * k) && d1 * k < dist) return false;
      if (d1 * k === dist) return true;
    }
    return false;
  }

  // Tiri (su 36) con cui l'avversario colpisce almeno una delle pedine scoperte indicate.
  function shotsAt(v, blots) {
    const sources = [];
    if (v.opBar) sources.push(0);
    for (let j = 1; j <= 24; j++) if (v.op[j]) sources.push(j);
    let n = 0;
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        if (blots.some((i) => sources.some((j) => canHit(v, j, i, d1, d2)))) n++;
      }
    }
    return n;
  }

  // Pedine scoperte che costano se colpite. Quelle ancora nella casa avversaria
  // (punti 19–24 per il bianco) perdono pochi pip, quindi non le contiamo.
  function exposure(s, player) {
    const v = view(s, player);
    const blots = [];
    for (let i = 1; i <= 18; i++) {
      if (v.me[i] !== 1) continue;
      const n = shotsAt(v, [i]);
      if (n) blots.push({ i, point: pointOf(player, i), shots: n });
    }
    blots.sort((a, b) => b.shots - a.shots);
    return { blots, shots: blots.length ? shotsAt(v, blots.map((b) => b.i)) : 0 };
  }

  function longestPrime(v) {
    let best = { len: 0, from: 0, to: 0 };
    let start = 0;
    for (let i = 1; i <= 25; i++) {
      if (i <= 24 && v.me[i] >= 2) {
        if (!start) start = i;
      } else if (start) {
        const len = i - start;
        if (len > best.len) best = { len, from: start, to: i - 1 };
        start = 0;
      }
    }
    return best;
  }

  function closedHome(v) {
    let n = 0;
    for (let i = 1; i <= 6; i++) if (v.me[i] >= 2) n++;
    return n;
  }

  function contact(v) {
    let myRear = v.myBar ? 25 : 0;
    for (let i = 24; i >= 1 && !myRear; i--) if (v.me[i]) myRear = i;
    let opRear = v.opBar ? 0 : 25;
    if (!v.opBar) for (let i = 1; i <= 24; i++) if (v.op[i]) { opRear = i; break; }
    return myRear > opRear;
  }

  const backCount = (v) => v.myBar + [19, 20, 21, 22, 23, 24].reduce((a, i) => a + v.me[i], 0);

  function pointComment(i, player) {
    const p = pointOf(player, i);
    if (i === 5) return t(`You made the <b>${p}-point</b>, the most valuable one: it's the heart of your home board and blocks your opponent.`, `Hai costruito il <b>punto ${p}</b>, il più prezioso: è nel cuore della tua casa e blocca l'avversario.`);
    if (i === 4) return t(`You made the <b>${p}-point</b>: a great home point, close to the middle.`, `Hai costruito il <b>punto ${p}</b>: un ottimo punto in casa, vicino al centro.`);
    if (i === 7) return t(`You made the <b>${p}-point</b> (the "bar point"): it blocks the 6s of your opponent's back checkers.`, `Hai costruito il <b>punto ${p}</b> (il "bar point"): blocca i 6 delle pedine avversarie rimaste indietro.`);
    if (i === 6 || i === 8 || i === 9) return t(`You made the <b>${p}-point</b>: another brick in the wall in front of your opponent's checkers.`, `Hai costruito il <b>punto ${p}</b>: un altro mattone del muro davanti alle pedine avversarie.`);
    if (i <= 3) return t(`You made the <b>${p}-point</b>: it counts at home, but it's very deep. Early in the game, points 4 to 7 are more useful.`, `Hai chiuso il <b>punto ${p}</b>: in casa conta, ma è molto avanzato. A inizio partita i punti dal 4 al 7 sono più utili.`);
    if (i >= 19) return t(`You made an <b>anchor</b> on point ${p}: a safe haven in your opponent's home board, from which you can hit.`, `Hai creato un'<b>ancora</b> sul punto ${p}: un rifugio sicuro nella casa avversaria, da cui puoi colpire.`);
    return t(`You joined two checkers on <b>point ${p}</b>: they're safe there now.`, `Hai unito due pedine sul <b>punto ${p}</b>: ora lì sono al sicuro.`);
  }
  const POINT_RANK = { 5: 10, 4: 9, 7: 8, 6: 7, 8: 6, 3: 5, 9: 4, 20: 4, 21: 4, 2: 2 };

  // Osservazioni sulla mossa giocata (prima → dopo). Restituisce [{tone, icon, html}] in ordine di importanza.
  function describeMove(before, after, player, moves) {
    const o = BG.opp(player);
    const vb = view(before, player);
    const va = view(after, player);
    const out = [];
    const add = (prio, tone, icon, html) => out.push({ prio, tone, icon, html });

    // Colpi
    const hits = after.bar[o] - before.bar[o];
    if (hits > 0) {
      const lost = BG.pipCount(after, o) - BG.pipCount(before, o);
      add(100, 'good', '💥', t(`${hits > 1 ? '<b>Double hit!</b>' : '<b>You hit!</b>'} Your opponent loses <b>${lost} pips</b> and must come in from the bar before moving.`,
        `${hits > 1 ? '<b>Doppio colpo!</b>' : '<b>Hai colpito!</b>'} L'avversario perde <b>${lost} pip</b> e prima di muovere dovrà rientrare dalla barra.`));
    }

    // Entrata dalla barra avversaria nella mia casa
    if (va.opBar) {
      const closed = closedHome(va);
      const enter = Math.round((1 - (closed / 6) ** 2) * 100);
      if (closed === 6) add(90, 'good', '🚪', t('Your home board is <b>completely closed</b>: your opponent on the bar can\'t come in until you open a point.', 'La tua casa è <b>completamente chiusa</b>: l\'avversario sulla barra non può rientrare finché non apri un punto.'));
      else if (closed >= 2) add(hits ? 85 : 40, 'info', '🚪', t(`You have <b>${closed} closed points</b> at home: your opponent comes in from the bar with only ${enter}% of rolls.`, `Hai <b>${closed} punti chiusi</b> in casa: l'avversario rientra dalla barra solo con ${art(enter)}% dei tiri.`));
    }

    // Punti nuovi
    const made = [];
    for (let i = 1; i <= 24; i++) if (vb.me[i] < 2 && va.me[i] >= 2) made.push(i);
    made.sort((a, b) => (POINT_RANK[b] || 1) - (POINT_RANK[a] || 1));
    if (made.length && contact(va)) add(70 + (POINT_RANK[made[0]] || 1), 'good', '🏠', pointComment(made[0], player) + (made.length > 1 ? t(` (and point ${made.slice(1).map((i) => pointOf(player, i)).join(', ')} too)`, ` (e anche il punto ${made.slice(1).map((i) => pointOf(player, i)).join(', ')})`) : ''));

    // Blocchi (prime)
    const pa = longestPrime(va);
    const pb = longestPrime(vb);
    if (pa.len >= 3 && pa.len > pb.len) {
      const range = t(`from ${pointOf(player, pa.to)} to ${pointOf(player, pa.from)}`, `dal ${pointOf(player, pa.to)} al ${pointOf(player, pa.from)}`);
      if (pa.len === 6) add(95, 'good', '🧱', t(`<b>Full prime</b> (${range})! Opposing checkers behind the wall can't get past.`, `<b>Blocco completo</b> (${range})! Le pedine avversarie dietro al muro non possono passare.`));
      else add(65, 'good', '🧱', t(`You have <b>${pa.len} points in a row</b> (${range}): a wall that's hard to jump. With 6 in a row nobody gets through.`, `Hai <b>${pa.len} punti di fila</b> (${range}): un muro difficile da scavalcare. Con 6 di fila nessuno passa.`));
    }

    // Sicurezza: pedine scoperte
    const eb = exposure(before, player);
    const ea = exposure(after, player);
    if (ea.shots) {
      const worst = ea.blots[0];
      const where = ea.blots.length === 1
        ? t(`your blot on <b>point ${worst.point}</b>`, `la pedina scoperta sul <b>punto ${worst.point}</b>`)
        : t(`your ${ea.blots.length} blots (the most exposed is on point ${worst.point})`, `le tue ${ea.blots.length} pedine scoperte (la più esposta è sul punto ${worst.point})`);
      const tone = ea.shots >= 12 ? 'bad' : 'info';
      add(tone === 'bad' ? 80 : 45, tone, '⚠️', t(`Your opponent can hit ${where} with <b>${tiri(ea.shots)} out of 36</b> (${pct(ea.shots)}%).`, `L'avversario può colpire ${where} con <b>${tiri(ea.shots)} su 36</b> (${pct(ea.shots)}%).`) +
        (tone === 'bad' && contact(va) ? t(' Blots close to opposing checkers are an easy target.', ' Le pedine scoperte vicino a quelle avversarie sono un bersaglio facile.') : ''));
    } else if (eb.shots && contact(va)) {
      add(60, 'good', '🛡️', t('All your checkers are <b>safe</b>: your opponent has no rolls that hit you.', 'Hai messo <b>al sicuro</b> tutte le pedine: l\'avversario non ha tiri per colpirti.'));
    }

    // Retrovie
    const backB = backCount(vb);
    const backA = backCount(va);
    if (backA < backB && contact(va)) {
      if (backA === 0) add(55, 'good', '🏃', t('All your back checkers have left your opponent\'s home board: they can no longer get trapped.', 'Tutte le tue pedine arretrate sono uscite dalla casa avversaria: non rischiano più di restare intrappolate.'));
      else add(35, 'info', '🏃', t(`You moved a back checker forward: ${pedine(backA)} still in your opponent's home board.`, `Hai fatto avanzare una pedina arretrata: ne restano ${pedine(backA)} nella casa avversaria.`));
    }

    // Pedine ammucchiate
    for (let i = 1; i <= 24; i++) {
      if (va.me[i] >= 6 && va.me[i] > vb.me[i] && contact(va)) {
        add(30, 'info', '📚', t(`You have <b>${va.me[i]} checkers</b> on point ${pointOf(player, i)}: stacked like that they don't do much. Better use them to make other points.`, `Hai <b>${va.me[i]} pedine</b> sul punto ${pointOf(player, i)}: ammucchiate così lavorano poco. Meglio usarle per costruire altri punti.`));
        break;
      }
    }

    // Corsa / uscita
    if (!contact(va)) {
      const me = BG.pipCount(after, player);
      const op = BG.pipCount(after, o);
      const diff = op - me;
      const lead = diff > 0 ? t(`you're <b>${diff} pips ahead</b>`, `sei <b>avanti di ${diff} pip</b>`)
        : diff < 0 ? t(`you're <b>${-diff} pips behind</b>`, `sei <b>indietro di ${-diff} pip</b>`) : t('you\'re <b>even</b>', 'siete <b>alla pari</b>');
      if (contact(vb)) add(75, 'info', '🏁', t(`The checkers can no longer touch: it's a <b>race</b> now and ${lead}. Only speed matters.`, `Non c'è più contatto tra le pedine: ora è una <b>corsa</b> e ${lead}. Conta solo la velocità.`));
      else if (BG.allHome(after, player)) add(20, 'info', '🏁', t(`Bearing off: ${lead}. Bear off one checker per die when you can, and fill the empty points at home.`, `Fase di uscita: ${lead}. Fai uscire una pedina per ogni dado quando puoi, e riempi i punti vuoti in casa.`));
      else add(20, 'info', '🏁', t(`Race: ${lead}. Bring your checkers home without waste: getting in counts more than going deep.`, `Corsa: ${lead}. Porta le pedine in casa senza sprechi: entrare in casa conta più che andare in fondo.`));
    }

    return out.sort((a, b) => b.prio - a.prio).map(({ tone, icon, html }) => ({ tone, icon, html }));
  }

  // Cosa avrebbe ottenuto in più la mossa migliore rispetto a quella giocata.
  function compareMoves(before, mineState, bestState, player) {
    const o = BG.opp(player);
    const out = [];
    const hitsBest = bestState.bar[o] - before.bar[o];
    const hitsMine = mineState.bar[o] - before.bar[o];
    if (hitsBest > hitsMine) {
      const lost = BG.pipCount(bestState, o) - BG.pipCount(before, o);
      out.push(t(`you would have <b>hit</b> and cost your opponent ${lost} pips`, `avresti <b>colpito</b> e fatto perdere all'avversario ${lost} pip`));
    }
    const sm = exposure(mineState, player).shots;
    const sb = exposure(bestState, player).shots;
    if (sm - sb >= 4) {
      out.push(sb
        ? t(`you would have left your opponent only ${tiri(sb)} out of 36 to hit you, instead of ${sm}`, `avresti lasciato all'avversario solo ${tiri(sb)} su 36 per colpirti, invece di ${sm}`)
        : t(`you would have left <b>no shots</b> at all (now ${sm} out of 36 hit you)`, `non avresti lasciato <b>nessun tiro</b> per colpirti (ora ne hai ${sm} su 36 contro)`));
    }
    const vm = view(mineState, player);
    const vbst = view(bestState, player);
    const vbef = view(before, player);
    const newPts = (v) => { const r = []; for (let i = 1; i <= 24; i++) if (vbef.me[i] < 2 && v.me[i] >= 2) r.push(i); return r; };
    const pm = newPts(vm);
    const extra = newPts(vbst).filter((i) => !pm.includes(i)).sort((a, b) => (POINT_RANK[b] || 1) - (POINT_RANK[a] || 1));
    if (extra.length && (POINT_RANK[extra[0]] || 1) >= 4) out.push(t(`you would have made the <b>${pointOf(player, extra[0])}-point</b>`, `avresti costruito il <b>punto ${pointOf(player, extra[0])}</b>`));
    if (longestPrime(vbst).len >= 3 && longestPrime(vbst).len > longestPrime(vm).len) out.push(t(`you would have extended your wall to ${longestPrime(vbst).len} points in a row`, `avresti allungato il tuo muro a ${longestPrime(vbst).len} punti di fila`));
    if (backCount(vbst) < backCount(vm) && !out.length) out.push(t('you would have escaped a back checker', 'avresti fatto uscire una pedina arretrata'));
    return out;
  }

  Object.assign(BG, { describeMove, compareMoves, exposure });
})(typeof window !== 'undefined' ? window : globalThis);
