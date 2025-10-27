const { test, expect } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias");
const { guardarJSON } = require("./utils/guardarJSON");

test("#LOG001# Login success", async ({ page }) => {
    console.log("#LOG001# LOGIN SUCCESS");
    console.log("#LOG001# Try to login on wallet");

    await page.goto("https://www.solbyte.com/es/empleo", {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector(".w-grid-list");

    const trabajos = await page.$$eval(".w-grid-list article", (articles) => {
        return articles.map((article) => {
            const linkEl = article.querySelector("h2 a");
            return {
                texto: linkEl?.innerText.trim() || "",
                href: linkEl?.href || "",
            };
        });
    });

    for (const [i, trabajo] of trabajos.entries()) {
        const jobPage = await page.context().newPage();
        console.log(`(${i + 1}/${trabajos.length}) Visitando: ${trabajo.href}`);
        await jobPage.goto(trabajo.href, { waitUntil: "domcontentloaded" });

        jobPage.on("console", (msg) => {
            if (msg.type() === "log") {
                console.log("[browser log]", msg.text());
            }
        });

        const data = await jobPage.evaluate(() => {
            const getDescripcion = () => {
                const h3s = Array.from(document.querySelectorAll("h3"));
                const descripcionH3 = h3s.find((h3) => h3.innerText.trim().toLowerCase() === "descripción");
                if (descripcionH3) {
                    const siguiente = descripcionH3.nextElementSibling;
                    if (siguiente && siguiente.tagName === "P") {
                        return siguiente.innerText.trim();
                    }
                }
                return "";
            };

            const getRequisitos = () => {
                const ps = Array.from(document.querySelectorAll("p"));
                const p = ps.find((p) => p.innerText.trim().toLowerCase().includes("requisitos mínimos"));

                if (p) {
                    let ul = p.nextElementSibling;
                    if (ul && ul.tagName === "UL") {
                        return Array.from(ul.querySelectorAll("li")).map((li) => li.innerText.trim());
                    }
                } else {
                    const requisitosH3 = Array.from(document.querySelectorAll("h3")).find(
                        (h3) => h3.innerText.trim().toLowerCase() === "requisitos"
                    );

                    //incluir aca el scrapeo con valorable
                    if (requisitosH3) {
                        const ul = requisitosH3.nextElementSibling;
                        if (ul && ul.tagName === "UL") {
                            return Array.from(ul.querySelectorAll("li")).map((li) => li.innerText.trim());
                        }

                        let el = requisitosH3.nextElementSibling;
                        const items = [];

                        while (el && el.tagName === "P") {
                            const texto = el.innerText?.trim() || "";

                            if (texto) {
                                const lineas = texto
                                    .split("\n") // esto separa por cada <br> ya interpretado por innerText
                                    .map((l) => l.replace(/^[-•\s\u00A0]+/, "").trim())
                                    .filter(Boolean);

                                items.push(...lineas);
                            }

                            el = el.nextElementSibling;
                        }

                        return items;
                    }
                }

                return [];
            };

            const getValorables = () => {
                const ps = Array.from(document.querySelectorAll("p"));
                const p = ps.find((p) => p.innerText.trim().toLowerCase().includes("requisitos a valorar"));

                if (p) {
                    let ul = p.nextElementSibling;
                    if (ul && ul.tagName === "UL") {
                        return Array.from(ul.querySelectorAll("li")).map((li) => li.innerText.trim());
                    } else {
                        const lineas = p.innerText.split("\n").slice(1); // saltamos título
                        return lineas.map((l) => l.replace(/^•[\s\u00A0]*/, "").trim()).filter(Boolean);
                    }
                } else {
                    const valorableH3 = Array.from(document.querySelectorAll("h3")).find(
                        (h3v) => h3v.innerText.trim().toLowerCase() === "valorable"
                    );

                    //incluir aca el scrapeo con valorable
                    if (valorableH3) {
                        const ul = valorableH3.nextElementSibling;
                        if (ul && ul.tagName === "UL") {
                            return Array.from(ul.querySelectorAll("li")).map((li) => li.innerText.trim());
                        }
                    }
                }

                return [];
            };

            return {
                descripcion_detallada: getDescripcion(),
                requisitos: getRequisitos(),
                valorables: getValorables(),
            };
        });

        trabajo.descripcion_detallada = data.descripcion_detallada;
        trabajo.requisitos = data.requisitos;
        trabajo.valorables = data.valorables;
        trabajo.paises = [];

        await jobPage.close();
    }

    //console.log(JSON.stringify(trabajos, null, 2));

    for (const trabajo of trabajos) {
        trabajo.requisitos_tecnologias = extraerTecnologias(trabajo.requisitos || []);
        trabajo.valorables_tecnologias = extraerTecnologias(trabajo.valorables || []);
    }

    console.log(JSON.stringify(trabajos, null, 2));
    guardarJSON("2710solbyte.json", trabajos);
});
