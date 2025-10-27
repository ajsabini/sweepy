// Normaliza texto: sin acentos, minúsculas, espacios colapsados
const norm = (s) =>
    String(s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .trim();

// Mapea sinónimos -> nombre canónico
const CARD_SYNONYMS = {
    Debito: ["debito", "tarjeta de debito", "tarjetas de debito"],
    Oro: ["oro"],
    Pymes: ["pymes", "pyme"],
    Corporativa: ["corporativa", "corporativas", "corporativo", "corporativos"],
    Platinum: ["platinum"],
    Black: ["black"],
    Infinite: ["infinite", "infinity"],
};

// Extrae el primer % que encuentre (20, 30, 15.5, etc.)
function extraerPorcentaje(texto) {
    const m = norm(texto).match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
    if (!m) return null;
    const num = parseFloat(m[1].replace(",", "."));
    return Number.isFinite(num) ? num : null;
}

/**
 * Dado un array de strings de descuentos, devuelve [{ tarjeta, porcentaje }]
 * @param {string[]} descuentos
 * @returns {{tarjeta: string, porcentaje: number}[]}
 */
export function extraerBeneficios(descuentos = []) {
    const out = [];
    for (const linea of descuentos) {
        const pct = extraerPorcentaje(linea);
        if (pct == null) continue;

        const t = norm(linea);

        // Si menciona débito, agregamos "Debito"
        if (t.includes("debito")) {
            out.push({ tarjeta: "Debito", porcentaje: pct });
        }

        // Para crédito: buscamos tarjetas específicas mencionadas
        // (no agregamos un genérico "Crédito")
        for (const [canonical, syns] of Object.entries(CARD_SYNONYMS)) {
            if (canonical === "Debito") continue; // ya lo manejamos arriba
            if (syns.some((s) => t.includes(s))) {
                out.push({ tarjeta: canonical, porcentaje: pct });
            }
        }
    }

    // Deduplicar pares exactos (por si se repiten líneas)
    const seen = new Set();
    return out.filter(({ tarjeta, porcentaje }) => {
        const key = `${tarjeta}|${porcentaje}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
