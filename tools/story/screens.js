/* Echte Bildpunkte aus dem Prototyp — die Screens im Video sind keine
   Nachbildung, sondern derselbe Code, der im Browser läuft. 3× Auflösung,
   damit sie in 1080 × 1920 auch beim Heranfahren scharf bleiben. */
const { chromium } = require('playwright-core');
const O = '/home/user/story/quellen/';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1500, height: 1400 }, deviceScaleFactor: 3 });
  await p.goto('file:///home/user/Mocktest/mockups/prototyp/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(1800);
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await p.evaluate(() => PROTOTYP.geraet('iphone'));
  await p.waitForTimeout(500);

  const schuss = async (schirm, name, vorher) => {
    await p.evaluate(k => PROTOTYP.gehen(k), schirm);
    await p.waitForTimeout(900);
    if (vorher) { await p.evaluate(vorher); await p.waitForTimeout(700); }
    const k = await p.evaluate(() => {
      const h = [...document.querySelectorAll('[data-pv-screen]')].filter(e => !e.hidden && e.getBoundingClientRect().width > 100)[0];
      const s = h.querySelector('.screen--iphone');
      const r = s.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });
    await p.screenshot({ path: O + name + '.png', clip: k });
    console.log(name.padEnd(18) + Math.round(k.width) + '×' + Math.round(k.height));
  };

  await schuss('heute', 'heute');
  await schuss('lernsitzung', 'lernsitzung');
  await schuss('notiz', 'notiz');
  await schuss('graph', 'graph');
  await schuss('journal', 'journal');
  await b.close();
})();
