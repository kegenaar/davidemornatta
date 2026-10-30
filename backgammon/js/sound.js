// Piccoli effetti sonori sintetizzati (nessun file audio esterno).
(function (root) {
  const BG = root.BG;
  let ctx = null;
  const audio = () => {
    if (!ctx) ctx = new (root.AudioContext || root.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  function knock(time, freq = 180, vol = 0.5, dur = 0.08) {
    const c = audio();
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq * 6;
    filter.Q.value = 1.2;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(filter).connect(g).connect(c.destination);
    src.start(time);
  }

  function tone(time, freq, dur, vol = 0.18, type = 'sine') {
    const c = audio();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o.connect(g).connect(c.destination);
    o.start(time);
    o.stop(time + dur + 0.05);
  }

  const Sound = {
    enabled: true,
    play(name) {
      if (!this.enabled) return;
      try {
        const t = audio().currentTime + 0.01;
        if (name === 'move') knock(t, 160, 0.7);
        else if (name === 'hit') { knock(t, 120, 0.9, 0.12); knock(t + 0.07, 220, 0.5); }
        else if (name === 'dice') { for (let i = 0; i < 5; i++) knock(t + i * 0.05 + Math.random() * 0.02, 300 + Math.random() * 200, 0.35, 0.04); }
        else if (name === 'success') { tone(t, 659, 0.15); tone(t + 0.1, 880, 0.3); }
        else if (name === 'error') { tone(t, 220, 0.25, 0.15, 'triangle'); }
        else if (name === 'win') { [523, 659, 784, 1046].forEach((f, i) => tone(t + i * 0.12, f, 0.35)); }
        else if (name === 'lose') { [392, 330, 262].forEach((f, i) => tone(t + i * 0.16, f, 0.4, 0.15, 'triangle')); }
      } catch (e) { /* audio non disponibile */ }
    },
  };
  BG.Sound = Sound;
})(window);
