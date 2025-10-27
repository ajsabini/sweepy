const { test, expect } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias");
const { guardarJSON } = require("./utils/guardarJSON");
const { extraerPaises } = require("./utils/paises");

test("Seleccionar IT en custom dropdown (dLocal careers)", async ({ page, browser }) => {
    await page.goto("https://sandbox.cripten.com/register", {
        waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(6000);

    await page.pause();
});
