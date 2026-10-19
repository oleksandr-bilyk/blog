import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    workers: 1,
    timeout: 90000,
    use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:5187", trace: "retain-on-failure" },
    webServer: {
        command: "npm run build && npm start",
        url: "http://127.0.0.1:5187",
        env: { PORT: "5187" },
        reuseExistingServer: false,
        timeout: 120000
    }
});
