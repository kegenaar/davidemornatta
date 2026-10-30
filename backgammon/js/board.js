// Tabellone SVG: disegno, selezione/trascinamento delle pedine e animazioni.
// Posizioni ("loc"): numeri 1..24, 'bar' (barra) oppure 'off' (vassoio di uscita).
(function (root) {
  const BG = root.BG;

  const G = { W: 60, R: 26, BAR: 58, F: 26, TRAY: 66, H: 600, PH: 250 };
  G.leftX = G.F;
  G.barX = G.F + 6 * G.W;
  G.rightX = G.barX + G.BAR;
  G.innerR = G.rightX + 6 * G.W;
  G.trayX = G.innerR + G.F;
  G.totalW = G.trayX + G.TRAY + G.F;
  G.top = G.F;
  G.bottom = G.F + G.H;
  G.totalH = G.H + 2 * G.F;
  G.midY = G.F + G.H / 2;

  const COLORS = {
    frame: '#4b3a2b',
    frameEdge: '#3a2c20',
    field: '#e9e2cc',
    ptA: '#769656',
    ptB: '#c49a6c',
    bar: '#4b3a2b',
    tray: '#3a2c20',
    last: 'rgba(255, 255, 51, 0.32)',
    select: 'rgba(255, 255, 51, 0.45)',
    hl: 'rgba(255, 170, 0, 0.42)',
    good: 'rgba(129, 182, 76, 0.55)',
    bad: 'rgba(250, 65, 45, 0.45)',
    arrow: 'rgba(255, 170, 0, 0.85)',
    arrowHint: 'rgba(92, 162, 230, 0.9)',
  };

  const colX = (c) => (c < 6 ? G.leftX + c * G.W + G.W / 2 : G.rightX + (c - 6) * G.W + G.W / 2);
  const pointCol = (p) => (p <= 12 ? 12 - p : p - 13);
  const isTop = (p) => p >= 13;
  const pointX = (p) => colX(pointCol(p));

  function spacing(n, max) {
    const sp = 2 * G.R;
    if (n <= 5) return sp;
    return Math.min(sp, (max - 2 * G.R) / (n - 1));
  }

  function checkerXY(loc, player, i, n) {
    if (loc === 'bar') {
      const sp = spacing(n, 200);
      const x = G.barX + G.BAR / 2;
      return player === BG.W
        ? { x, y: G.midY - 46 - G.R - i * sp * 0.9 }
        : { x, y: G.midY + 46 + G.R + i * sp * 0.9 };
    }
    if (loc === 'off') {
      const x = G.trayX + G.TRAY / 2;
      return player === BG.W
        ? { x, y: G.bottom - 10 - i * 15 }
        : { x, y: G.top + 10 + i * 15 };
    }
    const sp = spacing(n, G.PH + 24);
    const x = pointX(loc);
    return isTop(loc) ? { x, y: G.top + G.R + 2 + i * sp } : { x, y: G.bottom - G.R - 2 - i * sp };
  }

  function countAt(state, loc, player) {
    if (loc === 'bar') return state.bar[player];
    if (loc === 'off') return state.off[player];
    return BG.count(state, loc, player);
  }

  function ownerAt(state, loc) {
    if (typeof loc !== 'number') return null;
    const v = state.pts[loc];
    return v > 0 ? BG.W : v < 0 ? BG.B : null;
  }

  const PIPS = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };

  function dieSVG(cx, cy, size, value, player, used) {
    const fill = player === BG.W ? '#fbfbf6' : '#2b2b2b';
    const pip = player === BG.W ? '#262421' : '#f2f2ec';
    const off = size * 0.27;
    let s = `<g class="die" opacity="${used ? 0.32 : 1}">`;
    s += `<rect x="${cx - size / 2}" y="${cy - size / 2 + 3}" width="${size}" height="${size}" rx="${size * 0.18}" fill="rgba(0,0,0,0.35)"/>`;
    s += `<rect x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" rx="${size * 0.18}" fill="${fill}" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>`;
    for (const [dx, dy] of PIPS[value] || []) {
      s += `<circle cx="${cx + dx * off}" cy="${cy + dy * off}" r="${size * 0.09}" fill="${pip}"/>`;
    }
    return s + '</g>';
  }

  function checkerSVG(x, y, player, extra = '') {
    if (player === BG.W) {
      return `<g ${extra}><circle cx="${x}" cy="${y}" r="${G.R}" fill="url(#gw)" stroke="#a8a59a" stroke-width="1.5"/>` +
        `<circle cx="${x}" cy="${y}" r="${G.R * 0.66}" fill="none" stroke="rgba(0,0,0,0.10)" stroke-width="2"/></g>`;
    }
    return `<g ${extra}><circle cx="${x}" cy="${y}" r="${G.R}" fill="url(#gb)" stroke="#111" stroke-width="1.5"/>` +
      `<circle cx="${x}" cy="${y}" r="${G.R * 0.66}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="2"/></g>`;
  }

  function slabSVG(x, y, player) {
    const fill = player === BG.W ? '#f4f2ea' : '#2b2b2b';
    const stroke = player === BG.W ? '#a8a59a' : '#000';
    return `<rect x="${x - 24}" y="${y - 6}" width="48" height="12" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
  }

  function columnRect(loc) {
    if (loc === 'bar') return { x: G.barX, y: G.top, w: G.BAR, h: G.H };
    if (loc === 'off') return { x: G.trayX, y: G.top, w: G.TRAY, h: G.H };
    const x = pointX(loc) - G.W / 2;
    return isTop(loc) ? { x, y: G.top, w: G.W, h: G.H / 2 - 4 } : { x, y: G.midY + 4, w: G.W, h: G.H / 2 - 4 };
  }

  class Board {
    constructor(el, opts = {}) {
      this.el = el;
      this.opts = Object.assign({ showNumbers: true, showTargets: true }, opts);
      this.state = BG.emptyState();
      this.dice = [];
      this.highlights = [];
      this.arrows = [];
      this.lastMove = [];
      this.selected = null;
      this.targets = [];
      this.hidden = [];
      this.interaction = null; // { canPick, pick, drop, clear }
      this.onLocClick = null;
      this.drag = null;
      this.busy = false;
      el.classList.add('board');
      el.addEventListener('pointerdown', (e) => this._down(e));
      el.addEventListener('pointermove', (e) => this._move(e));
      el.addEventListener('pointerup', (e) => this._up(e));
      el.addEventListener('pointercancel', () => this._cancelDrag());
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      this.render();
    }

    set(props) {
      Object.assign(this, props);
      this.render();
    }

    // ---------- disegno ----------
    render() {
      const s = this.state;
      let svg = `<svg viewBox="0 0 ${G.totalW} ${G.totalH}" xmlns="http://www.w3.org/2000/svg">`;
      svg += `<defs>
        <radialGradient id="gw" cx="40%" cy="35%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#dcd8cc"/></radialGradient>
        <radialGradient id="gb" cx="40%" cy="35%" r="70%"><stop offset="0%" stop-color="#5a5a5a"/><stop offset="100%" stop-color="#1c1c1c"/></radialGradient>
        <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-opacity="0.45"/></filter>
        <marker id="ah" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="${COLORS.arrow}"/></marker>
        <marker id="ahh" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="${COLORS.arrowHint}"/></marker>
      </defs>`;
      // cornice e campo
      svg += `<rect x="0" y="0" width="${G.totalW}" height="${G.totalH}" rx="12" fill="${COLORS.frame}"/>`;
      svg += `<rect x="${G.leftX}" y="${G.top}" width="${6 * G.W}" height="${G.H}" fill="${COLORS.field}"/>`;
      svg += `<rect x="${G.rightX}" y="${G.top}" width="${6 * G.W}" height="${G.H}" fill="${COLORS.field}"/>`;
      svg += `<rect x="${G.barX}" y="${G.top - 6}" width="${G.BAR}" height="${G.H + 12}" fill="${COLORS.frameEdge}"/>`;
      svg += `<rect x="${G.trayX}" y="${G.top}" width="${G.TRAY}" height="${G.H}" rx="6" fill="${COLORS.tray}"/>`;
      svg += `<line x1="${G.trayX + 6}" x2="${G.trayX + G.TRAY - 6}" y1="${G.midY}" y2="${G.midY}" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>`;

      // triangoli
      for (let p = 1; p <= 24; p++) {
        const c = pointCol(p);
        const x = pointX(p);
        const top = isTop(p);
        const color = (c % 2 === 0) !== top ? COLORS.ptA : COLORS.ptB;
        const baseY = top ? G.top : G.bottom;
        const tipY = top ? G.top + G.PH : G.bottom - G.PH;
        svg += `<polygon points="${x - G.W / 2 + 2},${baseY} ${x + G.W / 2 - 2},${baseY} ${x},${tipY}" fill="${color}"/>`;
      }

      // evidenziazioni
      const tint = (loc, color) => {
        const r = columnRect(loc);
        return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${color}" pointer-events="none"/>`;
      };
      for (const loc of this.lastMove) svg += tint(loc, COLORS.last);
      for (const h of this.highlights) svg += tint(h.loc, COLORS[h.color || 'hl'] || h.color);
      if (this.selected != null) svg += tint(this.selected, COLORS.select);

      // numeri dei punti
      if (this.opts.showNumbers) {
        for (let p = 1; p <= 24; p++) {
          const y = isTop(p) ? G.top - 8 : G.bottom + 18;
          svg += `<text x="${pointX(p)}" y="${y}" class="pt-num" text-anchor="middle">${p}</text>`;
        }
      }

      // pedine sui punti
      for (let p = 1; p <= 24; p++) {
        const owner = ownerAt(s, p);
        if (!owner) continue;
        svg += this._stack(p, owner, Math.abs(s.pts[p]));
      }
      // barra
      for (const pl of [BG.W, BG.B]) if (s.bar[pl]) svg += this._stack('bar', pl, s.bar[pl]);
      // vassoio
      for (const pl of [BG.W, BG.B]) {
        const n = s.off[pl] - this._hiddenCount('off', pl);
        for (let i = 0; i < n; i++) {
          const { x, y } = checkerXY('off', pl, i, n);
          svg += slabSVG(x, y, pl);
        }
      }

      // destinazioni possibili
      if (this.opts.showTargets) {
        for (const t of this.targets) svg += this._targetSVG(t);
      }

      // dadi
      for (const d of this.dice) svg += this._diceSVG(d);

      // frecce
      for (const a of this.arrows) svg += this._arrowSVG(a);

      svg += `<g class="anim-layer"></g></svg>`;
      this.el.innerHTML = svg;
      this.svg = this.el.firstChild;
      this.animLayer = this.svg.querySelector('.anim-layer');
    }

    _hiddenCount(loc, player) {
      return this.hidden.filter((h) => h.loc === loc && h.player === player).length;
    }

    _stack(loc, player, n) {
      const visible = n - this._hiddenCount(loc, player);
      let out = '';
      for (let i = 0; i < visible; i++) {
        const { x, y } = checkerXY(loc, player, i, n);
        out += checkerSVG(x, y, player, 'filter="url(#sh)"');
      }
      if (visible > 5 || (loc === 'bar' && visible > 1)) {
        const { x, y } = checkerXY(loc, player, visible - 1, n);
        const fill = player === BG.W ? '#262421' : '#fff';
        out += `<text x="${x}" y="${y + 6}" text-anchor="middle" class="stack-num" fill="${fill}">${visible}</text>`;
      }
      return out;
    }

    _targetSVG(t) {
      const pl = t.player || BG.W;
      if (t.loc === 'off') {
        const n = this.state.off[pl];
        const { x, y } = checkerXY('off', pl, n, n + 1);
        return `<rect x="${x - 26}" y="${y - 8}" width="52" height="16" rx="4" fill="rgba(129,182,76,0.75)" class="pulse"/>`;
      }
      const n = countAt(this.state, t.loc, pl);
      if (t.hit) {
        const { x, y } = checkerXY(t.loc, BG.opp(pl), 0, 1);
        return `<circle cx="${x}" cy="${y}" r="${G.R + 1}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="6"/>`;
      }
      const { x, y } = checkerXY(t.loc, pl, n, n + 1);
      return `<circle cx="${x}" cy="${y}" r="11" fill="rgba(0,0,0,0.22)"/>`;
    }

    _diceSVG(d) {
      const n = d.values.length;
      const size = n > 2 ? 40 : 48;
      const gap = 10;
      const totalW = n * size + (n - 1) * gap;
      const cx = d.player === BG.W ? G.rightX + 3 * G.W : G.leftX + 3 * G.W;
      let out = '';
      d.values.forEach((v, i) => {
        const x = cx - totalW / 2 + size / 2 + i * (size + gap);
        out += dieSVG(x, G.midY, size, v, d.player, d.used && d.used[i]);
      });
      return out;
    }

    anchor(loc, player) {
      if (loc === 'bar') return { x: G.barX + G.BAR / 2, y: player === BG.W ? G.midY - 70 : G.midY + 70 };
      if (loc === 'off') return { x: G.trayX + G.TRAY / 2, y: player === BG.W ? G.bottom - 60 : G.top + 60 };
      return { x: pointX(loc), y: isTop(loc) ? G.top + G.R + 2 + 2 * G.R : G.bottom - G.R - 2 - 2 * G.R };
    }

    _arrowSVG(a) {
      const p1 = this.anchor(a.from, a.player || BG.W);
      const p2 = this.anchor(a.to, a.player || BG.W);
      const hint = a.color === 'hint';
      const color = hint ? COLORS.arrowHint : COLORS.arrow;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const ex = p2.x - (dx / len) * 18;
      const ey = p2.y - (dy / len) * 18;
      let path;
      if (a.from !== 'bar' && a.to !== 'off' && typeof a.from === 'number' && typeof a.to === 'number' && isTop(a.from) !== isTop(a.to)) {
        // curva quando la freccia passa da una metà all'altra
        const cxp = (p1.x + p2.x) / 2 + (p1.x > p2.x ? -40 : 40);
        path = `M${p1.x},${p1.y} Q${cxp},${G.midY} ${ex},${ey}`;
      } else {
        path = `M${p1.x},${p1.y} L${ex},${ey}`;
      }
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" marker-end="url(#${hint ? 'ahh' : 'ah'})" pointer-events="none"/>`;
    }

    // ---------- coordinate e input ----------
    _svgPoint(e) {
      const pt = this.svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      return pt.matrixTransform(this.svg.getScreenCTM().inverse());
    }

    locAt(x, y) {
      if (y < G.top - 10 || y > G.bottom + 10) return null;
      if (x >= G.trayX - 6 && x <= G.trayX + G.TRAY + 6) return 'off';
      if (x >= G.barX && x < G.rightX) return 'bar';
      let c = -1;
      if (x >= G.leftX && x < G.barX) c = Math.floor((x - G.leftX) / G.W);
      else if (x >= G.rightX && x < G.innerR) c = 6 + Math.floor((x - G.rightX) / G.W);
      if (c < 0) return null;
      return y < G.midY ? 13 + c : 12 - c;
    }

    topXY(state, loc, player) {
      const n = countAt(state, loc, player);
      return checkerXY(loc, player, Math.max(0, n - 1), Math.max(1, n));
    }

    _down(e) {
      if (this.busy || !this.svg) return;
      const p = this._svgPoint(e);
      const loc = this.locAt(p.x, p.y);
      const it = this.interaction;
      if (!it) {
        if (loc != null && this.onLocClick) this.onLocClick(loc);
        return;
      }
      if (loc == null) { it.clear(); return; }
      if (this.selected != null && this.targets.some((t) => t.loc === loc)) {
        it.drop(loc, true);
        return;
      }
      if (it.canPick(loc)) {
        const wasSelected = this.selected === loc;
        it.pick(loc);
        const player = it.player;
        this.drag = { loc, player, start: p, moved: false, wasSelected, pointerId: e.pointerId };
        try { this.el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        e.preventDefault();
        return;
      }
      const sel = this.selected;
      it.clear();
      if (it.reject) it.reject(loc, sel);
    }

    _move(e) {
      if (!this.drag) return;
      const p = this._svgPoint(e);
      const d = this.drag;
      if (!d.moved && Math.hypot(p.x - d.start.x, p.y - d.start.y) > 6) {
        d.moved = true;
        this.hidden = [{ loc: d.loc, player: d.player }];
        this.render();
        this.animLayer.innerHTML = checkerSVG(0, 0, d.player, 'class="ghost" filter="url(#sh)"');
        d.ghost = this.animLayer.firstChild;
      }
      if (d.moved && d.ghost) d.ghost.setAttribute('transform', `translate(${p.x},${p.y}) scale(1.08)`);
    }

    _up(e) {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      const p = this._svgPoint(e);
      const loc = this.locAt(p.x, p.y);
      if (d.moved) {
        this.hidden = [];
        if (loc != null && loc !== d.loc && this.targets.some((t) => t.loc === loc)) {
          this.interaction.drop(loc, false);
        } else {
          this.render();
          if (loc != null && loc !== d.loc && this.interaction.reject) this.interaction.reject(loc, d.loc);
        }
      } else if (d.wasSelected) {
        this.interaction.clear();
      }
    }

    _cancelDrag() {
      if (!this.drag) return;
      this.drag = null;
      this.hidden = [];
      this.render();
    }

    // ---------- animazioni ----------
    _tween(el, from, to, ms) {
      return new Promise((resolve) => {
        const t0 = performance.now();
        const step = (now) => {
          const k = Math.min(1, (now - t0) / ms);
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          const x = from.x + (to.x - from.x) * e;
          const y = from.y + (to.y - from.y) * e;
          const lift = Math.sin(Math.PI * k) * 0.08;
          el.setAttribute('transform', `translate(${x},${y}) scale(${1 + lift})`);
          if (k < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    }

    // Anima una mossa dallo stato `before` allo stato `after`.
    async animateMove(before, after, m, player, ms = 230) {
      const fromLoc = m.from === BG.barPoint(player) ? 'bar' : m.from;
      const toLoc = m.to === BG.offPoint(player) ? 'off' : m.to;
      const o = BG.opp(player);
      const fromXY = this.topXY(before, fromLoc, player);
      const toXY = toLoc === 'off' ? checkerXY('off', player, after.off[player] - 1, after.off[player]) : this.topXY(after, toLoc, player);
      this.busy = true;
      this.state = after;
      this.hidden = [{ loc: toLoc, player }];
      if (m.hit) this.hidden.push({ loc: 'bar', player: o });
      this.render();
      const ghost = (xy, pl) => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.innerHTML = checkerSVG(0, 0, pl, 'filter="url(#sh)"');
        g.setAttribute('transform', `translate(${xy.x},${xy.y})`);
        this.animLayer.appendChild(g);
        return g;
      };
      if (m.hit) {
        // la pedina colpita viene già mostrata sul punto: la nascondiamo e la spostiamo sulla barra
        const hitFrom = checkerXY(toLoc, o, 0, 1);
        const hitTo = this.topXY(after, 'bar', o);
        const gh = ghost(hitFrom, o);
        const g = ghost(fromXY, player);
        await this._tween(g, fromXY, toXY, ms);
        BG.Sound.play('hit');
        await this._tween(gh, hitFrom, hitTo, ms);
      } else {
        const g = ghost(fromXY, player);
        await this._tween(g, fromXY, toXY, ms);
        BG.Sound.play('move');
      }
      this.hidden = [];
      this.busy = false;
      this.render();
    }
  }

  Board.G = G;
  BG.Board = Board;
})(window);
