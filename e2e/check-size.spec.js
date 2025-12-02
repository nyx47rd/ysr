const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8000';

test.describe('Game Loading Logic', () => {

  test('should display size error and allow download from GitHub', async ({ page }) => {
    const largeGameFile = 'EaglecraftX-1.8-Beta-2.html';
    const gameName = 'Eaglecraft 1.8 Beta';
    const cdnUrl = `https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/${largeGameFile}`;
    const githubRawUrl = `https://raw.githubusercontent.com/bubbls/ugs-singlefile/main/UGS-Files/${largeGameFile}`;

    // Mock the CDN HEAD request
    await page.route(cdnUrl, (route) => {
      if (route.request().method() === 'HEAD') {
        route.fulfill({ status: 200, headers: { 'Content-Length': (51 * 1024 * 1024).toString() } });
      } else {
        route.continue();
      }
    });

    // Mock the GitHub download URL to avoid network dependency
    await page.route(githubRawUrl, (route) => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Disposition': `attachment; filename="${largeGameFile}"` },
        body: 'This is a fake game file.',
      });
    });

    await page.goto(`${BASE_URL}/game-template.html?game=${encodeURIComponent(largeGameFile)}&name=${encodeURIComponent(gameName)}`);

    const loadingMessage = page.locator('#loading-message');
    await expect(loadingMessage).toContainText(/Bu oyun \(51.00 MB\) tarayıcıda açılamayacak kadar büyük/);
    const downloadLink = loadingMessage.locator('#download-link');
    await expect(downloadLink).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await downloadLink.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(largeGameFile);
  });

  test('should load a normal size game in iframe', async ({ page }) => {
    const normalGameFile = 'slope.html';
    const gameName = 'Slope';
    const cdnUrl = `https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/${normalGameFile}`;
    const fakeHtmlContent = `<html><body><h1>Fake Game: ${gameName}</h1></body></html>`;

    await page.route(cdnUrl, (route) => {
      if (route.request().method() === 'HEAD') {
        route.fulfill({ status: 200, headers: { 'Content-Length': '10485760' } });
      } else if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'text/html', body: fakeHtmlContent });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE_URL}/game-template.html?game=${encodeURIComponent(normalGameFile)}&name=${encodeURIComponent(gameName)}`);

    const iframe = page.locator('#game-frame');
    await expect(iframe).toBeVisible({ timeout: 10000 });
    const frameContent = await iframe.contentFrame();
    await expect(frameContent.locator('h1')).toHaveText(`Fake Game: ${gameName}`);
    await expect(page.locator('#loading-message')).toBeHidden();
  });

  test('should handle 404 and show download link from GitHub', async ({ page }) => {
    const nonExistentGame = 'not-a-real-game.html';
    const gameName = 'Ghost Game';
    const cdnUrl = `https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/${nonExistentGame}`;
    const githubRawUrl = `https://raw.githubusercontent.com/bubbls/ugs-singlefile/main/UGS-Files/${nonExistentGame}`;

    // Mock the CDN HEAD request to 404
    await page.route(cdnUrl, (route) => route.fulfill({ status: 404 }));

    // Mock the GitHub download URL
    await page.route(githubRawUrl, (route) => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Disposition': `attachment; filename="${nonExistentGame}"` },
        body: 'This is a fake game file.',
      });
    });

    await page.goto(`${BASE_URL}/game-template.html?game=${encodeURIComponent(nonExistentGame)}&name=${encodeURIComponent(gameName)}`);

    const loadingMessage = page.locator('#loading-message');
    await expect(loadingMessage).toContainText("Oyun CDN'de bulunamadı. Lütfen güvenilir kaynaktan indirin.");
    const downloadLink = loadingMessage.locator('#download-link');
    await expect(downloadLink).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await downloadLink.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(nonExistentGame);
  });
});
