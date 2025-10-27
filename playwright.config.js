const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./tests",

    timeout: 270 * 1000,

    expect: {
        timeout: 96000,
    },

    fullyParallel: true,

    reporter: "html",

    use: {
        browserName: "chromium",
        headless: true,
        screenshot: "on",
        trace: "retain-on-failure",
    },
});
