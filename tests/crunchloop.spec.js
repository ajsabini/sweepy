const { test } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias");
const { guardarJSON } = require("./utils/guardarJSON");
const { extraerPaises } = require("./utils/paises");
const { limpiarRequisitos } = require("./utils/limpiar-requisitos");

test("Scrap Crunchloop job details", async ({ page, browser }) => {
    await page.goto("https://careers.crunchloop.io", {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("#jobs_list_container li");

    const trabajos = await page.$$eval("#jobs_list_container li", (items) =>
        items.map((li) => {
            const a = li.querySelector("a");
            const titulo = a?.querySelector("span[title]")?.innerText.trim() || "";
            const href = a?.href || "";
            return { titulo, href };
        })
    );

    const context = await browser.newContext();

    for (const trabajo of trabajos) {
        const jobPage = await context.newPage();
        await jobPage.goto(trabajo.href, { waitUntil: "domcontentloaded" });

        const data = await jobPage.evaluate(() => {
            const normalize = (text) =>
                text
                    ?.trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

            const getListAfterP = (label) => {
                const ps = Array.from(document.querySelectorAll("p"));
                const p = ps.find((p) => normalize(p.innerText).startsWith(normalize(label)));
                if (p) {
                    let ul = p.nextElementSibling;
                    while (ul && ul.tagName !== "UL") {
                        ul = ul.nextElementSibling;
                    }
                    if (ul) {
                        return Array.from(ul.querySelectorAll("li")).map((li) => li.innerText.trim());
                    }
                }
                return [];
            };

            const getRequisitos = () => {
                const normalize = (text) =>
                    text
                        ?.trim()
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");

                const ps = Array.from(document.querySelectorAll("p"));
                const pRequisitos = ps.find((p) => normalize(p.innerText).startsWith("requirements"));

                const requisitos = [];

                if (pRequisitos) {
                    let el = pRequisitos.nextElementSibling;

                    while (el) {
                        if (el.tagName === "P" && normalize(el.innerText).startsWith("nice to have")) {
                            break; // cortamos si llega a la parte de valorables
                        }

                        if (el.tagName === "UL") {
                            const items = Array.from(el.querySelectorAll("li")).map((li) => li.innerText.trim());
                            requisitos.push(...items);
                        }

                        el = el.nextElementSibling;
                    }
                }

                return requisitos;
            };

            const getPais = () => {
                const p = Array.from(document.querySelectorAll("p")).find((p) =>
                    normalize(p.innerText).startsWith("work modality")
                );

                if (p) {
                    const strong = p.querySelector("strong");
                    if (strong && strong.nextSibling) {
                        const texto = strong.nextSibling.textContent.trim();
                        const match = texto.match(/hybrid\s+(.*)/i);
                        if (match) {
                            return match[1]
                                .split(/[-,]/)
                                .map((s) => s.trim())
                                .filter(Boolean);
                        }
                    }
                }

                return [];
            };

            return {
                requisitos: getRequisitos(),
                valorables: getListAfterP("Nice to have:"),
                paises: getPais(),
            };
        });

        Object.assign(trabajo, data);

        await jobPage.close();
    }

    for (const trabajo of trabajos) {
        trabajo.requisitos_tecnologias = extraerTecnologias(trabajo.requisitos || []);
        trabajo.valorables_tecnologias = extraerTecnologias(trabajo.valorables || []);
    }

    for (const trabajo of trabajos) {
        trabajo.paises = extraerPaises(trabajo.paises || []);
    }

    for (const trabajo of trabajos) {
        trabajo.requisitos = limpiarRequisitos(trabajo.requisitos || []);
    }

    console.log(JSON.stringify(trabajos, null, 2));
    guardarJSON("crunchloop.json", trabajos);

    await context.close();
});
