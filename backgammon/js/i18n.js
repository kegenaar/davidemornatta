// Language: English by default, Italian via ?lang=it or the sidebar toggle (saved in localStorage).
// ponytail: strings live inline as BG.t(en, it) and are resolved once at load; switching language reloads the page.
(function (root) {
  const BG = (root.BG = root.BG || {});
  let lang = 'en';
  try {
    const q = new URLSearchParams(root.location.search).get('lang');
    if (q === 'en' || q === 'it') localStorage.setItem('tr_lang', q);
    lang = localStorage.getItem('tr_lang') === 'it' ? 'it' : 'en';
  } catch (e) { /* no browser (node tools) or no storage */ }
  BG.lang = lang;
  BG.t = (en, it) => (BG.lang === 'it' ? it : en);
  BG.setLang = (l) => { location.search = '?lang=' + l; };
})(typeof window !== 'undefined' ? window : globalThis);
