import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const localChromium = '/opt/pw-browsers/chromium';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:8799',
    ...devices['iPhone 13'],
    browserName: 'chromium',
    acceptDownloads: true,
    launchOptions: existsSync(localChromium) && !existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? { executablePath: localChromium } : {}
  },
  webServer: { command: 'node scripts/serve.mjs 8799', url: 'http://localhost:8799', reuseExistingServer: true }
});
