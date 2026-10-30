// Explains why a checker can't move, or can't go to a given point.
(function (root) {
  const BG = root.BG;
  const { W, t } = BG;

  const HOME = { w: t('points 1–6', 'punti 1–6'), b: t('points 19–24', 'punti 19–24') };
  const COLOR = { w: t('white', 'bianche'), b: t('black', 'nere') };

  const numOf = (player, loc) => (loc === 'bar' ? BG.barPoint(player) : loc);
  const distOff = (player, p) => (player === W ? p : 25 - p);
  const fwd = (player, from, to) => (player === W ? from - to : to - from);
  const ped = (n) => (n === 1 ? t('1 checker', '1 pedina') : t(`${n} checkers`, `${n} pedine`));
  const uniq = (dice) => [...new Set(dice)].sort((a, b) => b - a);
  const theDie = (d) => t(`a <b>${d}</b>`, d === 1 ? "l'<b>1</b>" : `il <b>${d}</b>`);
  const diceList = (dice) => uniq(dice).join(t(' and ', ' e '));

  function outsideHome(s, player) {
    let n = s.bar[player];
    for (let p = 1; p <= 24; p++) {
      const home = player === W ? p <= 6 : p >= 19;
      if (!home) n += BG.count(s, p, player);
    }
    return n;
  }

  function cannotBearOff(s, player) {
    const n = outsideHome(s, player);
    return t(
      `You can't bear off yet: first bring <b>all 15</b> checkers into your home board (${HOME[player]}). ` +
        `You still have <b>${ped(n)}</b> outside${s.bar[player] ? ' (including the one on the bar)' : ''}.`,
      `Non puoi ancora far uscire pedine: prima devi portare <b>tutte e 15</b> le pedine nella tua casa (${HOME[player]}). ` +
        `Ne hai ancora <b>${ped(n)}</b> fuori${s.bar[player] ? ' (compresa quella sulla barra)' : ''}.`);
  }

  function hasFarther(s, player, p) {
    if (player === W) { for (let q = p + 1; q <= 6; q++) if (s.pts[q] > 0) return true; }
    else { for (let q = p - 1; q >= 19; q--) if (s.pts[q] < 0) return true; }
    return false;
  }

  // Why the checker on "from" can't use die "die" (null if it can).
  function dieReason(s, player, from, die) {
    const p = numOf(player, from);
    const to = from === 'bar' ? BG.entryPoint(player, die) : player === W ? p - die : p + die;
    if (to >= 1 && to <= 24) {
      const oc = BG.count(s, to, BG.opp(player));
      return oc >= 2 ? t(`with ${theDie(die)} it would land on point ${to}, which is blocked (${ped(oc)} of your opponent)`,
        `con ${theDie(die)} andrebbe sul punto ${to}, che è bloccato (${ped(oc)} avversarie)`) : null;
    }
    if (!BG.allHome(s, player)) {
      const n = ped(outsideHome(s, player));
      return t(`with ${theDie(die)} it would bear off, but you can't bear off yet (${n} not in your home board)`,
        `con ${theDie(die)} uscirebbe dal tabellone, ma non puoi ancora far uscire pedine (${n} non sono nella tua casa)`);
    }
    if (distOff(player, p) < die && hasFarther(s, player, p)) {
      return t(`with ${theDie(die)} it can't bear off, because you still have checkers on higher points to move first`,
        `con ${theDie(die)} non può uscire, perché hai ancora pedine su punti più lontani da muovere prima`);
    }
    return null;
  }

  const DICE_RULE = t(
    'The rules make you use <b>all your dice</b> whenever possible (and the <b>higher</b> one if only one can be used): moving this checker you couldn\'t.',
    'Le regole ti obbligano a usare <b>tutti i dadi</b> quando è possibile (e il <b>più alto</b>, se se ne può usare uno solo): muovendo questa pedina non ci riusciresti.');

  // The user clicked a spot they can't move from.
  function explainPick(s, player, remaining, loc) {
    if (loc === 'off' || !remaining.length) return null;
    const own = loc === 'bar' ? s.bar[player] : BG.count(s, loc, player);
    if (!own) {
      if (loc !== 'bar' && BG.count(s, loc, BG.opp(player))) return t(`That's your opponent's checker: you play <b>${COLOR[player]}</b>.`, `Quella è una pedina dell'avversario: tu muovi le <b>${COLOR[player]}</b>.`);
      return null;
    }
    if (s.bar[player] && loc !== 'bar') return t('You have a checker on the <b>bar</b>: you must bring it back in before moving anything else.', 'Hai una pedina sulla <b>barra</b>: prima di muovere le altre devi farla rientrare.');
    const reasons = uniq(remaining).map((d) => dieReason(s, player, loc, d));
    if (reasons.every(Boolean)) {
      if (loc === 'bar') return t(`The checker on the bar can't enter: ${reasons.join('; ')}.`, `La pedina sulla barra non può rientrare: ${reasons.join('; ')}.`);
      return t(`The checker on point ${loc} can't move: ${reasons.join('; ')}.`, `La pedina sul punto ${loc} non può muoversi: ${reasons.join('; ')}.`);
    }
    const where = loc === 'bar' ? t('on the bar', 'sulla barra') : t(`on point ${loc}`, `sul punto ${loc}`);
    return t(`The checker ${where} can't move right now. ${DICE_RULE}`, `La pedina ${where} non si può muovere adesso. ${DICE_RULE}`);
  }

  // Sums reachable with the remaining dice, used in sequence.
  function reachable(remaining) {
    const sums = new Set();
    if (remaining.length && remaining.every((d) => d === remaining[0])) {
      for (let k = 1; k <= remaining.length; k++) sums.add(remaining[0] * k);
    } else {
      remaining.forEach((d) => sums.add(d));
      if (remaining.length === 2) sums.add(remaining[0] + remaining[1]);
    }
    return [...sums].sort((a, b) => a - b);
  }

  // If every way of covering "dist" pips stops on a blocked point,
  // returns those stops ([point, opposing checkers]), one per dice order.
  function blockedStops(s, player, p, dist, remaining) {
    const seqs = [];
    if (remaining.every((d) => d === remaining[0])) {
      seqs.push(new Array(dist / remaining[0]).fill(remaining[0]));
    } else if (remaining.length === 2 && remaining[0] + remaining[1] === dist) {
      seqs.push([remaining[0], remaining[1]], [remaining[1], remaining[0]]);
    }
    if (!seqs.length) return null;
    const stops = [];
    for (const seq of seqs) {
      let q = p;
      let hit = null;
      for (const d of seq.slice(0, -1)) {
        q = player === BG.W ? q - d : q + d;
        const n = BG.count(s, q, BG.opp(player));
        if (n >= 2) { hit = [q, n]; break; }
      }
      if (!hit) return null;
      stops.push(hit);
    }
    return stops;
  }

  // The user selected "from" and clicked/dragged onto "to", which isn't a valid destination.
  function explainDrop(s, player, remaining, from, to) {
    if (to === from || to === 'bar' || !remaining.length) return null;
    const p = numOf(player, from);
    if (to === 'off') {
      if (!BG.allHome(s, player)) return cannotBearOff(s, player);
      const dist = distOff(player, p);
      const max = Math.max(...remaining);
      if (max < dist) return t(`To bear off from point ${from} you need at least a <b>${dist}</b>, but your dice are ${diceList(remaining)}. Use them to bring it closer.`,
        `Per far uscire la pedina dal punto ${from} serve almeno un <b>${dist}</b>, ma i tuoi dadi sono ${diceList(remaining)}. Usali per avvicinarla all'uscita.`);
      if (max > dist && hasFarther(s, player, p)) return t('With a higher number than needed you can only bear off if you have no checkers on higher points. Move those first.',
        'Con un numero più alto del necessario puoi far uscire una pedina solo se non ne hai su punti più lontani. Muovi prima quelle.');
      return t(`That checker can't bear off right now. ${DICE_RULE}`, `Quella pedina non può uscire adesso. ${DICE_RULE}`);
    }
    const dist = fwd(player, p, to);
    if (dist <= 0) return t(`Checkers only move forward, towards your home board (${player === W ? 'from 24 down to 1' : 'from 1 up to 24'}).`,
      `Le pedine si muovono solo in avanti, verso la tua casa (${player === W ? 'dal 24 verso l\'1' : 'dall\'1 verso il 24'}).`);
    const oc = BG.count(s, to, BG.opp(player));
    if (oc >= 2) return t(`Point ${to} is <b>blocked</b>: it holds ${ped(oc)} of your opponent. You can only land on empty points, your own, or ones with a single opposing checker.`,
      `Il punto ${to} è <b>bloccato</b>: ci sono ${ped(oc)} avversarie. Puoi andare solo su punti vuoti, tuoi o con una sola pedina avversaria.`);
    const sums = reachable(remaining);
    if (!sums.includes(dist)) {
      const list = sums.join(', ').replace(/, (\d+)$/, t(' or $1', ' o $1'));
      return t(`To reach point ${to} you'd need a <b>${dist}</b>, but with the dice left you can move ${list} pips.`,
        `Per arrivare sul punto ${to} servirebbe un <b>${dist}</b>, ma con i dadi rimasti puoi muovere di ${list} punti.`);
    }
    const stops = blockedStops(s, player, p, dist, remaining);
    if (stops) {
      const desc = stops.map(([q, n]) => t(`<b>${q}</b> (${ped(n)} of your opponent)`, `<b>${q}</b> (${ped(n)} avversarie)`));
      const how = stops.length === 1
        ? t(`you have to move one ${remaining[0]} at a time, and the checker would have to stop on point ${desc[0]}, which is blocked.`,
          `devi muovere un passo da ${remaining[0]} alla volta, e la pedina dovrebbe fermarsi sul punto ${desc[0]}, che è bloccato.`)
        : t(`whichever order you use the dice in, the checker would have to stop on a blocked point, ${desc[0]} or ${desc[1]}.`,
          `in qualunque ordine usi i dadi, la pedina dovrebbe fermarsi su un punto bloccato, il punto ${desc[0]} oppure il punto ${desc[1]}.`);
      return t(`You can't reach point ${to}: ${how} You can't jump over a blocked point: every intermediate stop must be open.`,
        `Non puoi arrivare sul punto ${to}: ${how} Non si può saltare un punto bloccato: ogni tappa intermedia deve essere libera.`);
    }
    return t(`You can't reach point ${to}: moving like that you couldn't use all your dice, as the rules require.`,
      `Non puoi arrivare sul punto ${to}: muovendo così non riusciresti poi a usare tutti i dadi, come chiedono le regole.`);
  }

  Object.assign(BG, { explainPick, explainDrop, outsideHome });
})(typeof window !== 'undefined' ? window : globalThis);
