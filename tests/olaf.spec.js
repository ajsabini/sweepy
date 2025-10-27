const { test, expect } = require("@playwright/test");

test("#LOG001# Login success", async ({ page }) => {
    console.log("#LOG001# LOGIN SUCCESS");

    page.on("console", (msg) => {
        if (msg.type() === "log") {
            console.log("[browser log]", msg.text());
        }
    });

    await page.goto("https://www.solbyte.com/es/programador-senior-php", {
        waitUntil: "domcontentloaded",
    });

    const descripcion = await page.evaluate(() => {
        const h3s = Array.from(document.querySelectorAll("h3"));
        const descripcionH3 = h3s.find((h3) => h3.innerText.trim().toLowerCase() === "descripción");

        const ps = Array.from(document.querySelectorAll("p"));
        const p = ps.find((p) => p.innerText.trim().toLowerCase().includes("requisitos mínimos"));

        if (p) {
            console.log("Texto de <p> encontrado:", p.innerText);
            let ul = p.nextElementSibling;
            if (ul && ul.tagName === "UL") {
                return Array.from(ul.querySelectorAll("li")).map((li) => li.innerText.trim());
            }
        }

        if (descripcionH3) {
            const siguiente = descripcionH3.nextElementSibling;
            if (siguiente && siguiente.tagName === "P") {
                return siguiente.innerText.trim();
            }
        }

        return "";
    });

    console.log("DESCRIPCIÓN DETECTADA:");
    console.log(descripcion);

    await page.pause();
    /*for (const [i, trabajo] of trabajos.entries()) {
        const jobPage = await page.context().newPage();
        console.log(`(${i + 1}/${trabajos.length}) Visitando: ${trabajo.href}`);
        await jobPage.goto(trabajo.href, { waitUntil: "domcontentloaded" });

        const data = await jobPage.evaluate(() => {
            const getRequisitos = (label) => {
                const ps = Array.from(document.querySelectorAll("p"));
                const p = ps.find((p) => p.innerText.trim().toLowerCase().includes(label));
                if (p) {
                    let ul = p.nextElementSibling;
                    if (ul && ul.tagName === "UL") {
                        return Array.from(ul.querySelectorAll("li")).map((li) => li.innerText.trim());
                    }
                }
                return [];
            };

            return {
                descripcion_detallada: getDescripcion(),
                requisitos: getRequisitos("requisitos mínimos"),
                valorables: getRequisitos("requisitos a valorar"),
            };
        });

        trabajo.descripcion_detallada = data.descripcion_detallada;
        trabajo.requisitos = data.requisitos;
        trabajo.valorables = data.valorables;

        await jobPage.close();
    }*/

    //console.log(JSON.stringify(trabajos, null, 2));
});
