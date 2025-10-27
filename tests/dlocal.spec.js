/*const { test, expect } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias");
const { guardarJSON } = require("./utils/guardarJSON");
const { extraerPaises } = require("./utils/paises");

test("Seleccionar IT en custom dropdown (dLocal careers)", async ({ page, browser }) => {
    await page.goto("https://dlocal--careers.multiscreensite.com/", {
        waitUntil: "domcontentloaded",
    });

    // 1. Hacer clic en el dropdown "Team"
    const dropdown = page.locator("#department_team");
    await dropdown.click({ force: true }); // usamos force por visibilidad intermitente

    // 2. Esperar a que se despliegue la lista de opciones
    const opcionIT = page.locator('li[data-department="IT"] > div.option_hover');
    await opcionIT.waitFor({ state: "visible", timeout: 5000 });

    // 3. Hacer clic en la opción IT
    await opcionIT.click({ force: true });

    // 4. Esperar que se filtren los resultados
    await page.waitForTimeout(3000);

    while (await page.locator("span.text", { hasText: "More Jobs" }).isVisible()) {
        console.log("Clickeando 'More Jobs'...");
        await page.locator("span.text", { hasText: "More Jobs" }).click();
        await page.waitForTimeout(1000); // pequeña pausa para que cargue el nuevo contenido
    }

    const trabajos = await page.$$eval("ul.results > li.job-card", (items) =>
        items.map((li) => {
            const a = li.querySelector(".cardtitle a");
            const titulo = a?.innerText.trim() || "";
            const href = a?.href ? new URL(a.href, window.location.origin).toString() : "";
            return { titulo, href };
        })
    );

    const context = await browser.newContext();

    for (const trabajo of trabajos) {
        const pageW = await context.newPage();

        try {
            await pageW.goto(`${trabajo.href}`, { waitUntil: "domcontentloaded" });

            const fs = require("fs");

            const html = await pageW.content();
            fs.writeFileSync("debug.html", html);

            // Esperar lever-jd-categories (otros países)
            await pageW.waitForSelector("#lever-jd-categories", { timeout: 5000 });
            const otrosPaises = await pageW.$$eval("#lever-jd-categories .lever-category-value", (els) =>
                els.map((el) => el.textContent.trim())
            );

            // Esperar la categoría principal (paises/modalidad)
            await pageW.waitForSelector(".category-container", { timeout: 5000 });
            const [paises, modalidad, tipoModalidad] = await pageW.$$eval(
                ".category-container .category-item .lever-category-value",
                (spans) => spans.map((el) => el.innerText.trim())
            );

            // Esperar y scrapear requisitos
            let requisitos = [];

            try {
                await pageW.waitForFunction(
                    () => {
                        return !!document.querySelector("ul.list-view-des li");
                    },
                    { timeout: 10000 }
                );

                requisitos = await pageW.$$eval("ul.list-view-des li", (items) =>
                    items.map((li) => li.textContent.trim())
                );
            } catch (e) {
                console.log(`No se encontraron requisitos en ${trabajo.href}`);
            }

            trabajo.paises = otrosPaises || [];
            trabajo.modalidad = modalidad || "";
            trabajo.tipoModalidad = tipoModalidad || "";
            trabajo.requisitos = requisitos;
        } catch (err) {
            console.error(`Error al procesar trabajo ${trabajo.href}`, err);
        } finally {
            await pageW.close();
        }
    }

    for (const trabajo of trabajos) {
        trabajo.requisitos_tecnologias = extraerTecnologias(trabajo.requisitos || []);
        trabajo.valorables_tecnologias = extraerTecnologias(trabajo.valorables || []);
        trabajo.paises = extraerPaises(trabajo.paises || []);
        //trabajo.requisitos = limpiarRequisitos(trabajo.requisitos || []);
    }

    console.log(JSON.stringify(trabajos, null, 2));
    guardarJSON("dlocal.json", trabajos);

    await context.close();
});
*/
const { test } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias");
const { guardarJSON } = require("./utils/guardarJSON");
const { extraerPaises } = require("./utils/paises");

test("Scrapear trabajos dLocal y requisitos desde API", async ({ page, request, browser }) => {
    await page.goto("https://www.dlocal.com/careers/", {
        waitUntil: "domcontentloaded",
    });

    // Abrir dropdown y seleccionar IT
    const dropdown = page.locator("#department_team");
    await dropdown.click({ force: true });
    const opcionIT = page.locator('li[data-department="IT"] > div.option_hover');
    await opcionIT.waitFor({ state: "visible", timeout: 5000 });
    await opcionIT.click({ force: true });
    await page.waitForTimeout(3000);

    // Clickear "More Jobs"
    while (await page.locator("span.text", { hasText: "More Jobs" }).isVisible()) {
        await page.locator("span.text", { hasText: "More Jobs" }).click();
        await page.waitForTimeout(1000);
    }

    // Obtener lista de trabajos
    const trabajos = await page.$$eval("ul.results > li.job-card", (items) =>
        items.map((li) => {
            const a = li.querySelector(".cardtitle a");
            const titulo = a?.innerText.trim() || "";
            const href = a?.href ? new URL(a.href, window.location.origin).toString() : "";
            return { titulo, href };
        })
    );

    const context = await browser.newContext();

    for (const trabajo of trabajos) {
        const id = trabajo.href.split("/").pop();

        const apiUrl = `https://dlocal--careers.multiscreensite.com/rts/collections/public/6a366ace/runtime/collection/All%20Job%20Openings/data?filters=%7B%22field%22%3A%22id%22%2C%22operator%22%3A%22EQ%22%2C%22value%22%3A%22${id}%22%7D&fields=lists&fields=salaryRange&fields=salaryDescription&language=ENGLISH`;

        const response = await request.get(apiUrl);
        const json = await response.json();

        const requisitosRaw = json?.values?.[0]?.data?.lists || [];

        const cheerio = require("cheerio");

        const requisitos = [];

        for (const req of requisitosRaw) {
            const $ = cheerio.load(`<ul>${req.content}</ul>`);
            $("li").each((_, li) => {
                requisitos.push($(li).text().trim());
            });
        }

        const pageW = await context.newPage();

        await pageW.goto(`${trabajo.href}`, { waitUntil: "domcontentloaded" });

        await pageW.waitForSelector("#lever-jd-categories", { timeout: 5000 });
        const otrosPaises = await pageW.$$eval("#lever-jd-categories .lever-category-value", (els) =>
            els.map((el) => el.textContent.trim())
        );

        const [paises, modalidad, tipoModalidad] = await pageW.$$eval(
            ".category-container .category-item .lever-category-value",
            (spans) => spans.map((el) => el.innerText.trim())
        );

        trabajo.paises = otrosPaises || [];
        trabajo.modalidad = modalidad || "";
        trabajo.tipoModalidad = tipoModalidad || "";
        trabajo.requisitos = requisitos;
        trabajo.valorables = [];
        trabajo.requisitos_tecnologias = extraerTecnologias(requisitos);
        trabajo.valorables_tecnologias = [];
    }

    for (const trabajo of trabajos) {
        trabajo.requisitos_tecnologias = extraerTecnologias(trabajo.requisitos || []);
        trabajo.valorables_tecnologias = extraerTecnologias(trabajo.valorables || []);
        trabajo.paises = extraerPaises(trabajo.paises || []);
    }

    console.log(JSON.stringify(trabajos, null, 2));
    guardarJSON("2710dlocal_con_api.json", trabajos);
    await context.close();
});
