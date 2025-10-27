const { test } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias.js");
const { guardarJSON } = require("./utils/guardarJSON.js");
const { extraerPaises } = require("./utils/paises.js");
const { limpiarRequisitos } = require("./utils/limpiar-requisitos.js");
import { direccionAntesDeComa, extraerDirecciones } from "./utils/direccion.js";
const { extraerCiudades } = require("./utils/ciudades.js");
const { extraerDepartamentos } = require("./utils/departamentos.js");
import { extraerBeneficios } from "./utils/tarjetas.js";

test("Scrap bbva gastronomia", async ({ page, browser }) => {
    const baseUrl = "https://www.bbva.com.uy/personas/productos/tarjetas/descuentos/gastronomia/la-nueva-parrilla.html";

    await page.goto(baseUrl, {
        waitUntil: "domcontentloaded",
    });

    // *-vigencia
    const blockText = await page
        .locator(".promodetail__text")
        .first()
        .innerText()
        .catch(() => "");

    // Extraemos la línea de vigencia (ej: "Vigencia: 30 de Setiembre 2025")
    const m = blockText.match(/Vigencia:\s*([^\n\r]+)/i);
    const vigenciaText = m?.[1]?.trim() || null;

    // (Opcional) Parseamos a ISO YYYY-MM-DD si el formato es "DD de {mes} YYYY"
    function parseSpanishDate(s) {
        if (!s) return null;
        const normalize = (t) =>
            t
                .toLowerCase()
                .replace(/[áàä]/g, "a")
                .replace(/[éèë]/g, "e")
                .replace(/[íìï]/g, "i")
                .replace(/[óòö]/g, "o")
                .replace(/[úùü]/g, "u")
                .replace(/[ñ]/g, "n")
                .replace(/\s+/g, " ")
                .trim();

        const months = {
            enero: 1,
            febrero: 2,
            marzo: 3,
            abril: 4,
            mayo: 5,
            junio: 6,
            julio: 7,
            agosto: 8,
            septiembre: 9,
            setiembre: 9,
            octubre: 10,
            noviembre: 11,
            diciembre: 12,
        };

        const rx = /(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+(\d{4})/i;
        const mm = normalize(s).match(rx);
        if (!mm) return null;

        const day = parseInt(mm[1], 10);
        const monthName = mm[2];
        const year = parseInt(mm[3], 10);
        const month = months[monthName];
        if (!month || !day || !year) return null;

        const dd = String(day).padStart(2, "0");
        const mm2 = String(month).padStart(2, "0");
        return `${year}-${mm2}-${dd}`;
    }

    const vigenciaISO = parseSpanishDate(vigenciaText);

    console.log(vigenciaText);
    console.log(vigenciaISO);
    //-* vigencia

    //*- decuentos
    const descuentos = await page.evaluate(() => {
        const container = document.querySelector(".promodetail__text.rte");
        if (!container) return [];

        // Buscar el h3 que diga "Descuentos"
        const h3 = Array.from(container.querySelectorAll("h3")).find((el) =>
            /descuentos/i.test((el.textContent || "").replace(/\u00A0/g, " "))
        );
        if (!h3) return [];

        // Buscar el primer <ul> después de ese h3 (saltando otros hermanos)
        let sib = h3.nextElementSibling;
        while (sib && sib.tagName.toLowerCase() !== "ul") {
            sib = sib.nextElementSibling;
        }
        if (!sib) return [];

        // Normalizar texto (NBSP, espacios múltiples)
        const norm = (t) =>
            (t || "")
                .replace(/\u00A0/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        // Devolver los <li> como strings
        return Array.from(sib.querySelectorAll("li")).map((li) => norm(li.innerText || li.textContent || ""));
    });

    // Guardar en el objeto asociado a esa URL
    console.log(descuentos);
    const descuentoPorTarjeta = extraerBeneficios(descuentos);
    console.log(descuentoPorTarjeta);
    //-* descuentos

    //*-locales

    const locales = await page.evaluate(() => {
        // Contenedor del detalle
        const container =
            document.querySelector(".promodetail__text.rte") || document.querySelector(".promodetail__text");
        if (!container) return [];

        const norm = (t) =>
            (t || "")
                .replace(/\u00A0/g, " ") // NBSP -> espacio
                .replace(/\s+/g, " ") // espacios múltiples
                .trim();

        // Encontrar el <p> que contenga "Local:" o "Locales:"
        const pLocal = Array.from(container.querySelectorAll("p")).find((p) =>
            /\blocal(?:es)?:/i.test(norm(p.textContent))
        );

        if (!pLocal) return [];

        // Tomar el/los <ul> inmediatamente posteriores
        const items = [];
        let sib = pLocal.nextElementSibling;
        while (sib && sib.tagName && sib.tagName.toLowerCase() === "ul") {
            for (const li of sib.querySelectorAll("li")) {
                // Texto del li (limpio). Ej: "Ruta 10 ... Rocha (ir)" -> quita "(ir)" al final
                let txt = norm(li.innerText || li.textContent || "");
                txt = txt.replace(/\(\s*ir\s*\)\s*$/i, "").trim();
                items.push(txt);
            }
            sib = sib.nextElementSibling;
        }

        return items;
    });

    // Guardar en el item actual
    console.log(locales);
    console.log(direccionAntesDeComa(locales?.[0] ?? null));
    console.log(extraerCiudades(locales || []));
    console.log(extraerDepartamentos(locales || []));
    //-*locales

    //*-debito
    const debito = await page.evaluate(() => {
        const container =
            document.querySelector(".textandimage__text.rte") || document.querySelector(".textandimage__text");
        if (!container) return null;

        const norm = (t) =>
            (t || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // quita acentos
                .replace(/\u00A0/g, " ") // NBSP -> espacio normal
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();

        const clean = (t) =>
            (t || "")
                .replace(/\u00A0/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        // SOLO hijos directos <p> para mantener el orden real del bloque
        const ps = Array.from(container.querySelectorAll(":scope > p"));
        // Encontrar el índice del <p> cuyo texto (sin acentos/espacios) sea "tarjetas de debito"
        const idx = ps.findIndex((p) => {
            let txt = norm(p.textContent);
            // quitar un ":" final si lo hubiera
            if (txt.endsWith(":")) txt = txt.slice(0, -1);
            return txt === "tarjetas de debito";
        });

        if (idx === -1) return null;

        // Buscar el PRIMER <p> posterior que tenga contenido no vacío
        for (let i = idx + 1; i < ps.length; i++) {
            const txt = clean(ps[i].innerText || ps[i].textContent || "");
            if (txt) return txt; // este es el que queremos
        }
        return null;
    });

    console.log(debito);
    //-*debito

    //*-credito
    // === 1) Extraer pares (subtítulo -> párrafo) de la sección "TARJETAS DE CRÉDITO" ===
    const creditSegments = await page.evaluate(() => {
        const container =
            document.querySelector(".textandimage__text.rte") || document.querySelector(".textandimage__text");
        if (!container) return [];

        const norm = (s) =>
            (s || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\u00A0/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();

        const clean = (s) =>
            (s || "")
                .replace(/\u00A0/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        // Solo hijos directos para mantener orden real
        const ps = Array.from(container.querySelectorAll(":scope > p"));

        // Ubicar el título "TARJETAS DE CRÉDITO"
        const idxTitle = ps.findIndex((p) => norm(p.textContent).replace(/:$/, "") === "tarjetas de credito");
        if (idxTitle === -1) return [];

        const segments = [];
        let i = idxTitle + 1;

        while (i < ps.length) {
            // Buscar próximo <p> que actúe como subtítulo (suele tener <b>)
            while (i < ps.length) {
                const p = ps[i];
                const txt = clean(p.innerText || p.textContent || "");
                const isHeading = !!p.querySelector("b") && norm(txt) && norm(txt) !== "tarjetas de credito";
                if (isHeading) break;
                i++;
            }
            if (i >= ps.length) break;

            const headingP = ps[i];
            const heading = clean(headingP.innerText || headingP.textContent || "").replace(/:$/, "");

            // Tomar el PRIMER <p> con contenido que sigue al subtítulo como descripción
            let j = i + 1;
            let desc = "";
            while (j < ps.length) {
                const txt = clean(ps[j].innerText || ps[j].textContent || "");
                if (txt) {
                    desc = txt;
                    break;
                }
                j++;
            }

            if (desc) segments.push({ heading, text: desc });
            i = j + 1;
        }

        return segments;
    });

    // === 2) Definí tu universo de tarjetas (reemplazá/expandí según tu banco) ===
    const CARD_UNIVERSE = ["Internacional", "Oro", "Pymes", "Corporativa", "Platinum", "Black", "Infinite"];

    // Sinónimos para matchear subtítulos -> tarjetas del universo
    const CARD_SYNONYMS = {
        Internacional: ["internacional", "internacionales"],
        Oro: ["oro"],
        Pymes: ["pymes", "pyme"],
        Corporativa: ["corporativa", "corporativas", "corporativo", "corporativos"],
        Platinum: ["platinum"],
        Black: ["black"],
        Infinite: ["infinite", "infinity"], // por si acaso
    };

    const norm = (s) =>
        (s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\u00A0/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    function deriveCards(heading) {
        const h = norm(heading);
        const found = [];
        for (const [canonical, syns] of Object.entries(CARD_SYNONYMS)) {
            const inUniverse = CARD_UNIVERSE.some((c) => norm(c) === norm(canonical));
            if (!inUniverse) continue;
            if (syns.some((word) => h.includes(word))) found.push(canonical);
        }
        return found;
    }

    // === 3) Construir salida y guardar en r.credito ===
    credito = creditSegments.map((seg) => ({
        subtitulo: seg.heading, // ej: "Tarjetas de crédito Internacionales, Oro, Pymes y Corporativas"
        tarjetas: deriveCards(seg.heading), // ej: ["Internacional","Oro","Pymes","Corporativa"]
        parrafo: seg.text, // ej: "El descuento será de un 20%..."
    }));

    // (Opcional) índice por tarjeta para acceso directo
    credito_by_card = credito.reduce((acc, seg) => {
        for (const card of seg.tarjetas) acc[card] = seg.parrafo;
        return acc;
    }, {});
    //-*

    console.log(JSON.stringify(results, null, 2));

    guardarJSON("bbvauy.json", results);

    await page.pause();

    await context.close();
});
