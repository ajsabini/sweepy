const { test, expect } = require("@playwright/test");

test("#LOG001# Login success", async ({ page }) => {
    console.log("#LOG001# LOGIN SUCCESS");

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

        const data = await jobPage.evaluate(() => {
            const extractListaDesdeHTML = (label) => {
                const normalizar = (str) =>
                    str
                        .trim()
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");

                const h3s = Array.from(document.querySelectorAll("h3"));
                const h3 = h3s.find((el) => normalizar(el.innerText) === normalizar(label));

                if (h3) {
                    const next = h3.nextElementSibling;
                    if (next && next.tagName === "UL") {
                        return Array.from(next.querySelectorAll("li")).map((li) => li.innerText.trim());
                    }

                    // En caso de que tenga múltiples <p> con <br> o bullets (•)
                    let el = h3.nextElementSibling;
                    const items = [];

                    while (el && (el.tagName === "P" || el.tagName === "BR")) {
                        let texto = el.innerText?.trim() || "";
                        if (texto) {
                            const lineas = texto
                                .split(/\n|<br\s*\/?>/gi)
                                .flatMap((l) => l.split("•"))
                                .map((l) => l.replace(/^[-•\s\u00A0]+/, "").trim())
                                .filter(Boolean);

                            items.push(...lineas);
                        }
                        el = el.nextElementSibling;
                    }

                    return items;
                }

                return [];
            };

            const getDescripcion = () => {
                const h3 = Array.from(document.querySelectorAll("h3")).find(
                    (h) => h.innerText.trim().toLowerCase() === "descripción"
                );
                const p = h3?.nextElementSibling;
                return p?.tagName === "P" ? p.innerText.trim() : "";
            };

            return {
                descripcion_detallada: getDescripcion(),
                requisitos: extractListaDesdeHTML("Requisitos"),
                valorables: extractListaDesdeHTML("Valorable"),
            };
        });

        trabajo.descripcion_detallada = data.descripcion_detallada;
        trabajo.requisitos = data.requisitos;
        trabajo.valorables = data.valorables;

        await jobPage.close();
    }

    console.log(JSON.stringify(trabajos, null, 2));
});
