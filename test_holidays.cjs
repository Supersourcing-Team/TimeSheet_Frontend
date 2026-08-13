const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  
  console.log('Waiting for dashboard to render...');
  await page.waitForTimeout(3000);

  // Take a screenshot of the dashboard before clicking
  await page.screenshot({ path: 'dashboard.png' });
  console.log('Saved dashboard.png');

  // Click the Holidays tab
  console.log('Clicking Holidays tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const holidayBtn = buttons.find(b => b.textContent.includes('Holidays'));
    if (holidayBtn) {
      holidayBtn.click();
      console.log('Clicked Holidays button');
    } else {
      console.log('Holiday button not found');
    }
  });

  // Wait to see if error occurs
  console.log('Waiting for 5 seconds...');
  await page.waitForTimeout(5000);

  // Take a screenshot of the holidays tab
  await page.screenshot({ path: 'holidays.png' });
  console.log('Saved holidays.png');

  // Click Leave Types
  console.log('Clicking Leave Types tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const ltBtn = buttons.find(b => b.textContent.includes('Leave Types'));
    if (ltBtn) {
      ltBtn.click();
      console.log('Clicked Leave Types button');
    } else {
      console.log('Leave Types button not found');
    }
  });

  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'leavetypes.png' });
  console.log('Saved leavetypes.png');

  console.log('Done.');
  await browser.close();
})();
