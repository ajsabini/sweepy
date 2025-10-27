const { test, expect } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias");
const { guardarJSON } = require("./utils/guardarJSON");

test("Scrap Pyxis jobs with details", async ({ page, context }) => {
    await page.goto("https://pyxis.tech/open-position/#positions", {
        waitUntil: "domcontentloaded",
    });

    await page.waitForSelector(".swiper-slide");

    const trabajos = await page.$$eval(".swiper-slide", (slides) =>
        slides.map((slide) => {
            const titulo = slide.querySelector(".alt-font.title-small")?.innerText.trim() || "";
            const resumen = slide.querySelector(".mb-5")?.innerText.trim() || "";
            const href = slide.querySelector("a.btn")?.href || "";

            return {
                titulo,
                resumen,
                href,
            };
        })
    );

    for (const trabajo of trabajos) {
        const jobPage = await context.newPage();
        await jobPage.goto(trabajo.href, { waitUntil: "domcontentloaded" });

        const detalles = await jobPage.evaluate(() => {
            const normalize = (t) => t?.trim().toLowerCase() || "";

            const getDescripcion = () => {
                const ps = Array.from(document.querySelectorAll("p"));
                const match = ps.find((p) => normalize(p.innerText).includes("we are looking for talents who"));
                return match?.innerText.trim() || "";
            };

            const getListAfter = (label) => {
                const ps = Array.from(document.querySelectorAll("p"));
                const p = ps.find((p) => normalize(p.innerText).startsWith(label.toLowerCase()));
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

            const getPaises = () => {
                const ps = Array.from(document.querySelectorAll("p"));
                const whereP = ps.find((p) => p.innerText.trim().toLowerCase().startsWith("where?"));

                if (whereP) {
                    let siguiente = whereP.nextElementSibling;
                    while (siguiente && siguiente.tagName !== "P") {
                        siguiente = siguiente.nextElementSibling;
                    }

                    if (siguiente) {
                        return siguiente.innerText
                            .split(/,|\n/)
                            .map((p) => p.trim())
                            .filter(Boolean);
                    }
                }

                return [];
            };

            return {
                descripcion_detallada: getDescripcion(),
                requisitos: getListAfter("Requirements:"),
                valorables: getListAfter("Nice to have:"),
                paises: getPaises(),
            };
        });

        Object.assign(trabajo, detalles);

        await jobPage.close();
    }

    for (const trabajo of trabajos) {
        trabajo.requisitos_tecnologias = extraerTecnologias(trabajo.requisitos || []);
        trabajo.valorables_tecnologias = extraerTecnologias(trabajo.valorables || []);
    }

    console.log(JSON.stringify(trabajos, null, 2));
    guardarJSON("2710pyxis.json", trabajos);
});
