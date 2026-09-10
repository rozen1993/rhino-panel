const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:1000}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('https://rhino-panel.vercel.app/acceso',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Ingresar como Aunor',exact:true}).waitFor();
   const count=await page.getByRole('button',{name:/Ingresar como/}).count();
   if(count!==7)throw Error('Expected seven accounts, got '+count);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   if(overflow)throw Error('Horizontal overflow '+width);
   await page.screenshot({path:'.verificacion/current-access-real-'+width+'.png',fullPage:true});
   await page.getByRole('button',{name:'Ingresar como Aunor',exact:true}).click();
   if(await page.locator('dialog #usuario').inputValue()!=='aunor')throw Error('Username not prefilled');
   await page.keyboard.press('Escape');
   if(await page.locator('dialog').evaluate(e=>e.open))throw Error('Dialog did not close');
   if(errors.length)throw Error(errors.join('\n'));
   console.log(JSON.stringify({width,accounts:count,overflow,dialog:'passed',errors}));
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
