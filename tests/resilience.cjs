// Deterministic image fixtures are drawn locally; no personal photos or network APIs.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const origin = 'http://127.0.0.1:8084';
const key = 'parkd.spot.v1';
const results = [];
const output = path.join(root, 'test-results');

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const server = http.createServer((req, res) => {
    let file = path.join(root, 'dist', req.url.split('?')[0]);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'dist/index.html');
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(8084, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    args: process.env.CHROMIUM_EXECUTABLE_PATH ? ['--no-sandbox', '--no-zygote', '--single-process', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [] });
  async function scenario(name, run, init) {
    if (process.env.SCENARIO && !name.includes(process.env.SCENARIO)) return;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(origin);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.getByRole('button', { name: 'Save my spot', exact: true }).waitFor();
      await run(page, context);
      assert.deepEqual(errors, [], 'uncaught page errors');
      results.push({ name, status: 'PASS' });
    } catch (error) {
      results.push({ name, status: 'FAIL', error: error.message });
      await page.screenshot({ path: path.join(output, name.replace(/\W+/g, '-') + '.png'), fullPage: true }).catch(() => {});
    } finally { await page.close(); }
    console.log(results.at(-1));
  }
  const button = (page, name) => page.getByRole('button', { name, exact: true });
  async function choose(page, file) {
    const event = page.waitForEvent('filechooser');
    await button(page, 'Choose').click();
    await (await event).setFiles(file);
  }
  async function saved(page) {
    return JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
  }
  async function imageInfo(page, uri) {
    return page.evaluate(async uri => {
      const image = new Image(); image.src = uri; await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    }, uri);
  }
  try {
    const specs = [
      { name: 'landscape', width: 4032, height: 3024, mime: 'image/jpeg', color: '#ccd5ef' },
      { name: 'portrait', width: 3024, height: 4032, mime: 'image/jpeg', color: '#a1acd5' },
      { name: 'panorama', width: 3000, height: 600, mime: 'image/jpeg', color: '#a6b8a1' },
      { name: 'small', width: 320, height: 240, mime: 'image/png', color: '#aaa4b8' },
      { name: 'transparent', width: 1400, height: 1400, mime: 'image/png', color: null },
      { name: 'dark', width: 1920, height: 1080, mime: 'image/jpeg', color: '#22232b' },
    ];
    for (const spec of specs) {
      await scenario(`photo ${spec.name}: three replacements, reload, offline save and find`, async (page, context) => {
        let previous;
        for (let cycle = 0; cycle < 3; cycle++) {
          if (cycle === 0) await button(page, 'Save without GPS').click();
          else await button(page, 'Edit parking details').click();
          const data = await page.evaluate(({ spec, cycle }) => {
            const canvas = document.createElement('canvas'); canvas.width = spec.width; canvas.height = spec.height;
            const c = canvas.getContext('2d');
            if (spec.color) { c.fillStyle = spec.color; c.fillRect(0, 0, canvas.width, canvas.height); }
            c.fillStyle = '#4162f6'; c.fillRect(canvas.width * .08, canvas.height * .15, canvas.width * .84, canvas.height * .7);
            c.fillStyle = 'white'; c.font = `bold ${Math.floor(Math.min(canvas.width, canvas.height) / 7)}px sans-serif`;
            c.fillText(`B${cycle + 1} / C14`, canvas.width * .12, canvas.height * .55);
            return canvas.toDataURL(spec.mime, .92).split(',')[1];
          }, { spec, cycle });
          await choose(page, { name: `${spec.name}.${spec.mime.endsWith('png') ? 'png' : 'jpg'}`, mimeType: spec.mime, buffer: Buffer.from(data, 'base64') });
          await page.getByLabel('Selected parking photo').waitFor();
          // Wait for transformation to finish before saving.
          await page.waitForFunction(() => document.querySelector('[aria-label="Save details"]')?.getAttribute('aria-disabled') !== 'true');
          await page.getByLabel('Floor', { exact: true }).fill(`B${cycle + 1}`);
          await page.getByLabel('Zone or space').fill('C14');
          await page.getByLabel('Parking note').fill('Blue lift → level B2 → pillar C14. مصعد أزرق');
          await context.setOffline(true);
          await button(page, 'Save details').click();
          await button(page, 'Find my car').waitFor();
          const record = await saved(page);
          assert.equal(record.latitude, undefined);
          assert.match(record.photo, /^data:image\/jpeg;base64,/);
          assert.ok(record.photo.length < 1500100);
          assert.notEqual(record.photo, previous, 'replacement must update image bytes');
          previous = record.photo;
          const dimensions = await imageInfo(page, record.photo);
          assert.ok(Math.max(dimensions.width, dimensions.height) <= 1200);
          assert.ok(Math.abs(dimensions.width / dimensions.height - spec.width / spec.height) < .01);
          await button(page, 'Find my car').click();
          assert.equal(await button(page, 'Open in Maps').count(), 0);
          await page.getByText(`Floor B${cycle + 1} · Zone C14`, { exact: true }).last().waitFor();
          await button(page, 'View parking photo').click();
          await page.getByLabel('Your full parking photo').waitFor();
          if (cycle === 2) await page.screenshot({ path: path.join(output, `photo-${spec.name}.png`) });
          // Web export needs its bundle server for a cold load; native airplane-mode
          // cold launches must be tested separately on the APK.
          await context.setOffline(false);
          await page.goto(origin);
          await button(page, 'Find my car').waitFor();
          await page.reload();
          await button(page, 'Find my car').waitFor();
          assert.equal((await saved(page)).photo, previous);
        }
        await button(page, 'Edit parking details').click();
        await button(page, 'Remove photo').click();
        await button(page, 'Save details').click();
        await button(page, 'Find my car').waitFor();
        await page.reload();
        await button(page, 'Find my car').waitFor();
        assert.equal((await saved(page)).photo, undefined);
        assert.equal((await saved(page)).zone, 'C14');
      });
    }
    await scenario('picker blocks saving until selection or cancellation', async page => {
      await button(page, 'Save without GPS').click();
      await page.getByLabel('Floor', { exact: true }).fill('B2');
      const event = page.waitForEvent('filechooser');
      await button(page, 'Choose').click(); await event;
      assert.equal(await button(page, 'Save details').getAttribute('aria-disabled'), 'true');
      await page.locator('input[type=file]').dispatchEvent('cancel');
      await button(page, 'Save details').click();
      await button(page, 'Find my car').waitFor();
    });
    await scenario('invalid image preserves existing clues and editor recovers', async page => {
      await button(page, 'Save without GPS').click();
      await page.getByLabel('Floor', { exact: true }).fill('B2');
      await choose(page, { name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not an image') });
      await page.getByText('Could not add that photo. Try another image or continue with your parking details.').waitFor();
      await button(page, 'Save details').click();
      await button(page, 'Find my car').waitFor();
      assert.equal((await saved(page)).floor, 'B2');
    });
    await scenario('GPS timeout leaves manual fallback usable', async page => {
      await button(page, 'Save my spot').click();
      await page.getByText(/GPS is taking a while/).waitFor({ timeout: 16000 });
      assert.equal(await saved(page), null);
      await button(page, 'Save without GPS').click();
      await page.getByLabel('Parking note').fill('Basement, beside stairs');
      await button(page, 'Save details').click();
      await button(page, 'Find my car').waitFor();
    }, () => {
      navigator.permissions.query = async () => ({ state: 'granted' });
      navigator.geolocation.getCurrentPosition = () => {};
    });
    await scenario('failed clear preserves parking data', async page => {
      await button(page, 'Save without GPS').click();
      await page.getByLabel('Floor', { exact: true }).fill('B2');
      await button(page, 'Save details').click();
      await button(page, 'Find my car').click();
      await button(page, 'I’m back at my car').click();
      await button(page, 'Yes, I’m back').click();
      await page.getByText('Could not clear your spot. Try again.').waitFor();
      assert.equal((await saved(page)).floor, 'B2');
    }, () => {
      const remove = Storage.prototype.removeItem;
      Storage.prototype.removeItem = function(k) { if (k === 'parkd.spot.v1') throw Error('Disk unavailable'); return remove.call(this, k); };
    });
    await scenario('failed edit preserves previous saved spot', async page => {
      await button(page, 'Save without GPS').click();
      await page.getByLabel('Floor', { exact: true }).fill('B2');
      await button(page, 'Save details').click();
      await button(page, 'Edit parking details').click();
      await page.getByLabel('Floor', { exact: true }).fill('B3');
      await page.evaluate(() => {
        Storage.prototype.setItem = () => { throw Error('Storage full'); };
      });
      await button(page, 'Save details').click();
      await page.getByText('Your changes could not be saved. Please try again.').waitFor();
      assert.equal((await saved(page)).floor, 'B2');
      await page.reload();
      await page.getByLabel('Floor', { exact: true }).waitFor();
      assert.equal(await page.getByLabel('Floor', { exact: true }).inputValue(), 'B2');
    });
    await scenario('damaged saved data is not silently overwritten', async page => {
      await page.evaluate(k => localStorage.setItem(k, '{damaged'), key);
      await page.reload();
      await page.getByText('Let’s recover your spot.').waitFor();
      assert.equal(await button(page, 'Save my spot').count(), 0);
      await button(page, 'Try again').click();
      await page.getByText('Your saved spot could not be loaded. Retry before saving a new one.').waitFor();
      assert.equal(await page.evaluate(k => localStorage.getItem(k), key), '{damaged');
    });
    await scenario('photo-only spot cannot lose its last clue', async page => {
      await button(page, 'Save without GPS').click();
      await choose(page, path.join(root, 'assets/icon.png'));
      await page.getByLabel('Selected parking photo').waitFor();
      await button(page, 'Save details').click();
      await button(page, 'Edit parking details').click();
      const before = await saved(page);
      await button(page, 'Remove photo').click();
      await button(page, 'Save details').click();
      await page.getByText('Add a photo, floor, zone, or note so you can find your car later.').waitFor();
      assert.equal((await saved(page)).photo, before.photo);
    });
    await scenario('late GPS response does not replace a manual spot', async page => {
      await button(page, 'Save my spot').click();
      await page.getByText(/GPS is taking a while/).waitFor({ timeout: 16000 });
      await button(page, 'Save without GPS').click();
      await page.getByLabel('Floor', { exact: true }).fill('B2');
      await button(page, 'Save details').click();
      await button(page, 'Find my car').waitFor();
      await page.evaluate(() => window.finishGPS());
      await page.reload();
      await button(page, 'Find my car').waitFor();
      assert.equal((await saved(page)).floor, 'B2');
      assert.equal((await saved(page)).latitude, undefined);
    }, () => {
      navigator.permissions.query = async () => ({ state: 'granted' });
      navigator.geolocation.getCurrentPosition = success => {
        window.finishGPS = () => success({ timestamp: Date.now(), coords: { latitude: 25.28, longitude: 51.53, accuracy: 10 } });
      };
    });
    await scenario('way back steps persist offline and Enter finishes the note', async (page, context) => {
      await button(page, 'Save without GPS').click();
      await page.getByLabel('Entrance or landmark').fill('Bershka');
      await page.getByLabel('Lift or stairs').fill('Blue lift beside Bershka');
      await page.getByLabel('Floor', { exact: true }).fill('B1');
      await page.getByLabel('Zone or space').fill('X');
      await page.getByLabel('Parking space', { exact: true }).fill('142');
      const note = page.getByLabel('Parking note');
      await note.fill('Beside the blue pillar');
      await note.press('Enter');
      assert.equal(await note.inputValue(), 'Beside the blue pillar');
      assert.equal(await note.evaluate(el => document.activeElement === el), false);
      await button(page, 'Save details').click();
      await button(page, 'Find my car').waitFor();
      await page.reload();
      await button(page, 'Find my car').waitFor();
      await context.setOffline(true);
      await button(page, 'Find my car').click();
      await page.getByRole('heading', { name: 'Go to Bershka', exact: true }).waitFor();
      await page.getByRole('heading', { name: 'Go to floor B1', exact: true }).waitFor();
      await page.getByRole('heading', { name: 'Zone X · Space 142', exact: true }).waitFor();
      await page.screenshot({ path: path.join(root, 'docs/06-your-way-back.png') });
      await page.setViewportSize({ width: 320, height: 640 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 320));
      assert.equal((await saved(page)).space, '142');
    });
    await scenario('return progress survives reload and completion clears the spot', async page => {
      await button(page, 'Save without GPS').click();
      await page.getByLabel('Entrance or landmark').fill('Bershka');
      await page.getByLabel('Floor', { exact: true }).fill('B1');
      await page.getByLabel('Zone or space').fill('X');
      await page.getByLabel('Parking space', { exact: true }).fill('142');
      await button(page, 'Save details').click();
      await button(page, 'Find my car').click();
      await button(page, 'I’m here · Next step').click();
      assert.equal((await saved(page)).returnStep, 1);
      await page.reload();
      await button(page, 'I’m here · Next step').waitFor();
      assert.equal((await saved(page)).returnStep, 1);
      await button(page, 'I’m here · Next step').click();
      assert.equal((await saved(page)).returnStep, 2);
      assert.equal((await saved(page)).zone, 'X');
      assert.equal(await button(page, 'I’m here · Next step').count(), 0);
      await button(page, 'I’m back at my car').click();
      await button(page, 'Yes, I’m back').click();
      await button(page, 'Save my spot').waitFor();
      assert.equal(await saved(page), null);
    });
    await scenario('Maps pin URL is dispatched on the first tap on web', async page => {
      await page.evaluate(() => { window.open = url => { window.mapPinURL = url; return null; }; });
      await button(page, 'Save my spot').click();
      await button(page, 'Find my car').click();
      await button(page, 'Open in Maps').click();
      assert.match(await page.evaluate(() => window.mapPinURL), /query=25.28%2C51.53/);
    }, () => {
      navigator.permissions.query = async () => ({ state: 'granted' });
      navigator.geolocation.getCurrentPosition = success => success({ timestamp: Date.now(), coords: { latitude: 25.28, longitude: 51.53, accuracy: 10 } });
    });
    await scenario('long clues remain within narrow screen', async page => {
      await page.setViewportSize({ width: 320, height: 640 });
      await button(page, 'Save without GPS').click();
      await page.getByLabel('Floor', { exact: true }).fill('BASEMENTLEVELTWENTY1');
      await page.getByLabel('Zone or space').fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ1234');
      await page.getByLabel('Parking note').fill('طابق سفلي بالقرب من المصعد الأزرق '.repeat(12));
      await button(page, 'Save details').click();
      await button(page, 'Find my car').waitFor();
      await page.getByText('BASEMENTLEVELTWENTY1', { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, 'long-clues.png') });
      const overflow = await page.evaluate(() => [...document.querySelectorAll('div')].filter(e => {
        const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
      }).map(e => e.textContent.slice(0, 80)));
      assert.deepEqual(overflow, [], 'content must fit viewport');
    });
  } finally {
    fs.writeFileSync(path.join(output, 'resilience.json'), JSON.stringify(results, null, 2) + '\n');
    await browser.close(); server.close();
  }
  if (!results.length || results.some(r => r.status !== 'PASS')) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
