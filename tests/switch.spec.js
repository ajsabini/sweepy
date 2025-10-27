/*const { test, expect } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias");
const { guardarJSON } = require("./utils/guardarJSON");

test("#LOG001# Login success", async ({ page }) => {
    console.log("#LOG001# LOGIN SUCCESS");
    console.log("#LOG001# Try to login on wallet");

    let laUrl = "https://www.switchsoftware.io/";
    const trabajosFiltrados = [];

    await page.goto(laUrl + "careers#positions", {
        waitUntil: "domcontentloaded",
    });

    const verTodoSelector = ".w-pagination-next";
    const botonExiste = await page.$(verTodoSelector);

    if (botonExiste) {
        await page.click(verTodoSelector);
        await page.waitForTimeout(2000); // esperar que cargue nuevo contenido
    }

    await page.waitForSelector(".w-dyn-item");

    const trabajos = await page.evaluate(() => {
        const items = document.querySelectorAll(".w-dyn-item");
        const resultados = [];

        let laUrl = "https://www.switchsoftware.io";

        items.forEach((item) => {
            const titulo = item.querySelector(".title_merger")?.innerText?.trim();
            const href = item.querySelector("a.w-inline-block")?.getAttribute("href");

            if (titulo && href) {
                resultados.push({
                    titulo,
                    href: `${laUrl}${href}`,
                });
            }
        });

        return resultados;
    });

    for (const trabajo of trabajos) {
        if (trabajo.titulo.toLowerCase().includes("talent pool")) continue;

        console.log(`🔍 Scrapeando: ${trabajo.titulo}`);
        await page.goto(trabajo.href, { waitUntil: "domcontentloaded" });

        const resultado = await page.evaluate(() => {
            const requisitos = [];

            const tipoModalidad =
                document.querySelector(".category-2.service")?.innerText?.trim().toLowerCase() || null;

            const extraerDesdeTitulo = (tituloBuscado) => {
                const h2s = Array.from(document.querySelectorAll("h2"));
                for (const h2 of h2s) {
                    if (h2.innerText.trim().toLowerCase().includes(tituloBuscado)) {
                        let siguiente = h2.nextElementSibling;
                        while (siguiente && siguiente.tagName === "UL") {
                            const lis = Array.from(siguiente.querySelectorAll("li"));
                            for (const li of lis) {
                                requisitos.push(li.innerText.trim());
                            }
                            siguiente = siguiente.nextElementSibling;
                        }
                    }
                }
            };

            extraerDesdeTitulo("requirements");
            extraerDesdeTitulo("required qualifications");

            return { requisitos, tipoModalidad };
        });

        trabajosFiltrados.push({
            titulo: trabajo.titulo,
            url: trabajo.href,
            requisitos: resultado.requisitos,
            tipo_modalidad: resultado.tipoModalidad,
            paises: [],
            modalidad: [],
        });

        for (const trabajo of trabajosFiltrados) {
            trabajo.requisitos_tecnologias = extraerTecnologias(trabajo.requisitos || []);
        }
    }

    // Mostrar resultados
    console.dir(trabajosFiltrados, { depth: null });
});
*/

const { test } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias");
const { extraerFrameworks } = require("./utils/frameworks");
const { extraerLenguajes } = require("./utils/lenguajes");
const { guardarJSON } = require("./utils/guardarJSON");

test("#LOG001# Scraping SwitchSoftware jobs", async ({ browser }) => {
    console.log("#LOG001# Iniciando scraping");

    const laUrl = "https://www.switchsoftware.io/";
    const trabajosFiltrados = [];

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(laUrl + "careers#positions", {
        waitUntil: "domcontentloaded",
    });

    const verTodoSelector = ".w-pagination-next";
    const botonExiste = await page.$(verTodoSelector);

    if (botonExiste) {
        await page.click(verTodoSelector);
        await page.waitForTimeout(2000);
    }

    await page.waitForSelector(".w-dyn-item");

    const trabajos = await page.evaluate(() => {
        const items = document.querySelectorAll(".w-dyn-item");
        const resultados = [];
        const laUrl = "https://www.switchsoftware.io";

        items.forEach((item) => {
            const titulo = item.querySelector(".title_merger")?.innerText?.trim();
            const href = item.querySelector("a.w-inline-block")?.getAttribute("href");
            if (titulo && href) {
                resultados.push({
                    titulo,
                    href: `${laUrl}${href}`,
                });
            }
        });

        return resultados;
    });

    for (const trabajo of trabajos) {
        if (trabajo.titulo.toLowerCase().includes("talent pool")) continue;

        console.log(`🔍 Scrapeando: ${trabajo.titulo}`);

        const detallePage = await context.newPage();
        await detallePage.goto(trabajo.href, { waitUntil: "domcontentloaded" });

        const resultado = await detallePage.evaluate(() => {
            const requisitos = [];

            const tipoModalidad =
                document.querySelector(".category-2.service")?.innerText?.trim().toLowerCase() || null;

            const extraerDesdeTitulo = (tituloBuscado) => {
                const h2s = Array.from(document.querySelectorAll("h2"));
                for (const h2 of h2s) {
                    if (h2.innerText.trim().toLowerCase().includes(tituloBuscado)) {
                        let siguiente = h2.nextElementSibling;
                        while (siguiente && siguiente.tagName === "UL") {
                            const lis = Array.from(siguiente.querySelectorAll("li"));
                            for (const li of lis) {
                                requisitos.push(li.innerText.trim());
                            }
                            siguiente = siguiente.nextElementSibling;
                        }
                    }
                }
            };

            extraerDesdeTitulo("requirements");
            extraerDesdeTitulo("required qualifications");

            return { requisitos, tipoModalidad };
        });

        await detallePage.close();

        trabajosFiltrados.push({
            titulo: trabajo.titulo,
            url: trabajo.href,
            requisitos: resultado.requisitos,
            tipo_modalidad: resultado.tipoModalidad,
            requisitos_tecnologias: extraerTecnologias(resultado.requisitos || []),
            requisitos_frameworks: extraerFrameworks(resultado.requisitos || []),
            requisitos_lenguajes: extraerLenguajes(resultado.requisitos || []),
            paises: [],
            modalidad: [],
        });
    }

    await page.close();
    await context.close();

    console.dir(trabajosFiltrados, { depth: null });
    guardarJSON("switch.json", trabajosFiltrados);
});
