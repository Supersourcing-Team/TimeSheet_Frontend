const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));

  console.log('Navigating to http://localhost:5173...');
  try {
    await page.goto('http://localhost:5173');
  } catch (e) {
    console.log('Failed to connect to 5173, trying 3000...');
    await page.goto('http://localhost:3000');
  }

  // Check if we are on login page
  const title = await page.title();
  console.log('Page Title:', title);

  // Attempt login
  console.log('Logging in...');
  await page.fill('input[type="email"]', 'admin@timesheet.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Wait for login to complete and dashboard to load
  console.log('Waiting for dashboard...');
  await page.waitForTimeout(3000);

  // Click the Holidays tab
  console.log('Clicking Holidays tab...');
  try {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const holidayBtn = buttons.find(b => b.textContent.includes('Holidays'));
      if (holidayBtn) holidayBtn.click();
      else console.log('BROWSER_CONSOLE: Holiday button not found');
    });
  } catch (e) {
    console.log('Error clicking holiday tab:', e.message);
  }

  // Wait to see if error occurs
  console.log('Waiting for 3 seconds...');
  await page.waitForTimeout(3000);

  console.log('Done.');
  await browser.close();
})();
