// Test export API
import { chromium } from 'playwright-core';

async function testPlaywright() {
  console.log('Testing Playwright chromium launch...');
  
  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    console.log('✅ Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('✅ Page created successfully');
    
    await page.setContent('<h1>Hello World</h1>');
    console.log('✅ Content set successfully');
    
    const screenshot = await page.screenshot({ type: 'png' });
    console.log('✅ Screenshot created:', screenshot.length, 'bytes');
    
    const pdf = await page.pdf({ format: 'A4' });
    console.log('✅ PDF created:', pdf.length, 'bytes');
    
    await browser.close();
    console.log('✅ Browser closed successfully');
    
    console.log('\n🎉 All Playwright tests passed!');
  } catch (error) {
    console.error('❌ Playwright test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPlaywright();
