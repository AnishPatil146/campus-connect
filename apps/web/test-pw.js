const { chromium } = require('@playwright/test');

async function testPlaywright() {
  try {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:3001');
    const title = await page.title();
    console.log('Successfully launched Edge! Page title:', title);
    await browser.close();
  } catch (err) {
    console.error('Edge error:', err.message);
    try {
      const browser2 = await chromium.launch({ channel: 'chrome', headless: true });
      const page2 = await browser2.newPage();
      await page2.goto('http://localhost:3001');
      console.log('Successfully launched Chrome! Page title:', await page2.title());
      await browser2.close();
    } catch (err2) {
      console.error('Chrome error:', err2.message);
    }
  }
}

testPlaywright();
