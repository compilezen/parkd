const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const origin = 'http://127.0.0.1:8083';

(async () => {
  const server = http.createServer((req, res) => {
    let file = path.join(root, 'dist', req.url.split('?')[0]);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'dist/index.html');
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.html') ? 'text/html' : file.endsWith('.png') ? 'image/png' : 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(8083, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: process.env.CHROMIUM_EXECUTABLE_PATH ? ['--no-sandbox', '--no-zygote', '--single-process', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, geolocation: { latitude: 25.2854, longitude: 51.531, accuracy: 10 }, permissions: ['geolocation'] });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.getByRole('button', { name: 'Save my spot', exact: true }).waitFor();
    await page.screenshot({ path: path.join(root, 'docs/01-home.png') });
    await page.getByRole('button', { name: 'Save without GPS', exact: true }).click();
    await page.getByRole('button', { name: 'Save details', exact: true }).click();
    await page.getByText('Add a photo, floor, zone, or note so you can find your car later.').waitFor();
    await page.getByLabel('Floor', { exact: true }).fill('B2');
    await page.getByLabel('Zone or space').fill('C14');
    await page.getByLabel('Parking note').fill('Near the blue lift');
    await page.screenshot({ path: path.join(root, 'docs/02-details.png') });
    await page.getByRole('button', { name: 'Save details', exact: true }).click();
    await page.getByText('Your car is here.', { exact: true }).last().waitFor();
    await page.reload();
    await page.getByText('C14', { exact: true }).waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    console.log('Saved layout', await page.evaluate(() => ({ scroll: window.scrollY, height: document.documentElement.scrollHeight, viewport: innerHeight })));
    await page.screenshot({ path: path.join(root, 'docs/03-saved.png') });
    await page.getByRole('button', { name: 'Find my car', exact: true }).click();
    await page.getByText('Floor B2 · Zone C14', { exact: true }).last().waitFor();
    assert.equal(await page.getByRole('button', { name: 'Open in Maps', exact: true }).count(), 0);
    await page.screenshot({ path: path.join(root, 'docs/04-find.png') });
    await page.getByRole('button', { name: 'I’m back at my car', exact: true }).click();
    await page.getByRole('button', { name: 'Keep my spot', exact: true }).click();
    assert.ok(await page.evaluate(() => localStorage.getItem('parkd.spot.v1')));
    await page.getByRole('button', { name: 'I’m back at my car', exact: true }).click();
    await page.getByRole('button', { name: 'Yes, I’m back', exact: true }).click();
    await page.getByRole('button', { name: 'Save my spot', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('parkd.spot.v1')), null);
    console.log('PASS manual save, empty validation, reload persistence, manual find, clear confirmation');

    await page.getByRole('button', { name: 'Save my spot', exact: true }).click();
    await page.getByText('Your car is here.', { exact: true }).last().waitFor();
    let saved = JSON.parse(await page.evaluate(() => localStorage.getItem('parkd.spot.v1')));
    assert.equal(saved.latitude, 25.2854);
    await page.getByRole('button', { name: 'Find my car', exact: true }).click();
    await page.getByRole('button', { name: 'Open in Maps', exact: true }).waitFor();
    console.log('PASS mocked GPS save and Maps action available');

    await page.goto(origin + '/details');
    await page.getByRole('button', { name: 'Choose', exact: true }).waitFor();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose', exact: true }).click();
    await (await chooser).setFiles(path.join(root, 'assets/icon.png'));
    await page.getByLabel('Selected parking photo').waitFor();
    await page.getByRole('button', { name: 'Save details', exact: true }).click();
    await page.getByRole('button', { name: 'View parking photo' }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'View parking photo' }).waitFor();
    saved = JSON.parse(await page.evaluate(() => localStorage.getItem('parkd.spot.v1')));
    assert.match(saved.photo, /^data:image\/jpeg;base64,/);
    assert.equal(saved.latitude, 25.2854);
    console.log('PASS photo selection, compression, persistence, direct editor route preserves GPS');

    await page.getByRole('button', { name: 'About parkd' }).click();
    await page.screenshot({ path: path.join(root, 'docs/05-about.png') });
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(origin + '/details');
    await page.getByRole('button', { name: 'Save details' }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 320));
    console.log('PASS 320 px editor has no page overflow');
    

    const denied = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await denied.addInitScript(() => { navigator.permissions.query = async () => ({ state: 'denied' }); navigator.geolocation.getCurrentPosition = (_success, error) => error({ code: 1, PERMISSION_DENIED: 1, message: 'Permission denied' }); });
    const deniedPage = await denied.newPage();
    await deniedPage.goto(origin);
    await deniedPage.evaluate(() => localStorage.clear()); await deniedPage.reload();
    await deniedPage.getByRole('button', { name: 'Save my spot', exact: true }).click();
    await deniedPage.getByText(/Location access is off/).waitFor();
    assert.equal(await deniedPage.evaluate(() => localStorage.getItem('parkd.spot.v1')), null);
    await deniedPage.getByRole('button', { name: 'Save without GPS', exact: true }).click();
    await deniedPage.getByLabel('Floor', { exact: true }).waitFor();
    console.log('PASS permission denial leaves manual fallback available');
    

    const failure = await browser.newContext();
    await failure.addInitScript(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'parkd.spot.v1') throw new Error('Disk full'); return original.call(this, key, value); }; });
    const failedPage = await failure.newPage();
    await failedPage.goto(origin);
    await failedPage.evaluate(() => localStorage.clear()); await failedPage.reload();
    await failedPage.getByRole('button', { name: 'Save without GPS', exact: true }).click();
    await failedPage.getByLabel('Floor', { exact: true }).fill('B2');
    await failedPage.getByRole('button', { name: 'Save details', exact: true }).click();
    await failedPage.getByText('Your changes could not be saved. Please try again.').waitFor();
    assert.equal(await failedPage.evaluate(() => localStorage.getItem('parkd.spot.v1')), null);
    console.log('PASS failed storage write does not claim success');
    
    assert.deepEqual(errors, []);
    console.log('PASS no uncaught page errors');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
