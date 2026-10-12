const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), origin = 'http://127.0.0.1:8085';
const code = fs.readFileSync(path.join(root, 'src/i18n/catalog.ts'), 'utf8');
const rows = JSON.parse(code.slice(code.indexOf('= ') + 2).trim().replace(/;$/, ''));
const catalog = new Map(rows.map(row => [row[0], row]));
const langs = ['English','العربية','中文','Español','हिन्दी'], ids = ['en','ar','zh','es','hi'];
(async () => {
 const server=http.createServer((req,res)=> {let file=path.join(root,'dist',req.url.split('?')[0]);if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'dist/index.html');res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(8085,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:process.env.CHROMIUM_EXECUTABLE_PATH?['--no-sandbox','--no-zygote','--single-process','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const output=path.join(root,'docs/languages');fs.mkdirSync(output,{recursive:true});
 const button=name=>page.getByRole('button',{name,exact:true});
 async function fits(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow');}
 try {
  for(let i=0;i<5;i++) {
   const tr=k=>catalog.get(k)[i];await page.goto(origin);await page.evaluate(()=>localStorage.clear());await page.reload();await button('Language').click();await page.getByRole('radio',{name:langs[i],exact:true}).click();
   await page.getByText(tr('Choose your language'),{exact:true}).waitFor({state:'hidden'});await button(tr('Save without GPS')).waitFor();await page.screenshot({path:path.join(output,ids[i]+'-home.png')});await fits();
   assert.equal(await page.evaluate(()=>localStorage.getItem('parkd.language.v1')),ids[i]);
   await button(tr('Save without GPS')).click();await button(tr('Save details')).click();await page.getByText(tr('Add a photo, floor, zone, or note so you can find your car later.'),{exact:true}).waitFor();
   await page.getByLabel(tr('Entrance or landmark'),{exact:true}).fill('Bershka');await page.getByLabel(tr('Floor'),{exact:true}).fill('B1');await page.getByLabel(tr('Zone or space'),{exact:true}).fill('X');await page.getByLabel(tr('Parking space'),{exact:true}).fill('142');await page.getByLabel(tr('Parking note'),{exact:true}).fill('Floor / Zone: keep exactly');
   await page.screenshot({path:path.join(output,ids[i]+'-details.png')});await fits();await button(tr('Save details')).click();await button(tr('Find my car')).waitFor();await page.reload();await button(tr('Find my car')).waitFor();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('parkd.spot.v1')).note),'Floor / Zone: keep exactly');
   await page.screenshot({path:path.join(output,ids[i]+'-saved.png')});await button(tr('Find my car')).click();await button(tr('I’m here · Next step')).waitFor();
   await page.screenshot({path:path.join(output,ids[i]+'-find.png')});await fits();await button(tr('I’m here · Next step')).click();await page.reload();await button(tr('I’m here · Next step')).waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('parkd.spot.v1')).returnStep),1);
   await button(tr('Go back')).click();await button(tr('About parkd')).click();await page.getByText(tr('Saved on your device'),{exact:true}).waitFor();await page.screenshot({path:path.join(output,ids[i]+'-about.png')});assert.ok(!(await page.locator('body').innerText()).includes('\\n'));
   if(i!==0) {const text=await page.locator('body').innerText();assert.ok(!text.includes('Location only when you ask'));assert.ok(!text.includes('Clearing app data'));}
   await page.setViewportSize({width:320,height:640});await fits();await page.goto(origin);await button(tr('Language')).click();await page.getByRole('radio',{name:langs[i],exact:true}).waitFor();await fits();await button(tr('Close')).click();await page.setViewportSize({width:390,height:844});
   console.log('PASS',ids[i],'home, editor, validation, saved, return, about, persistence, narrow layout');
  }
  // A failed language write must leave the current language/data unchanged.
  await page.goto(origin);await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('Disk full');};});await button(catalog.get('Language')[4]).click();await page.getByRole('radio',{name:'English',exact:true}).click();await page.getByText(catalog.get('Could not save your language. Try again.')[4],{exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('parkd.language.v1')),'hi');
  assert.deepEqual(errors,[]);console.log('PASS language save failure preserves selection; no uncaught errors');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
