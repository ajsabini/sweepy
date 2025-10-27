// utils/ciudades.js (ESM)
export const CIUDADES = [
    "Punta del Este",
    "Pocitos",
    "Carrasco",
    "Zonamerica",
    "Punta Ballena",
    "Goes",
    "Sayago",
    "Punta Carretas",
    "Ciudad Vieja",
    "Punta Fría",
    "Piriápolis", // ← corregido
    "Laguna Garzón",
];

const normalize = (s) =>
    String(s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // sin acentos
        .replace(/\u00A0/g, " ") // NBSP -> espacio
        .toLowerCase();

const CANON_BY_NORM = new Map(CIUDADES.map((c) => [normalize(c), c]));

/**
 * @param {string|string[]} entrada - string suelto o array de strings
 * @returns {string[]} ciudades encontradas (canónicas, sin duplicados)
 */
export function extraerCiudades(entrada) {
    const plano = Array.isArray(entrada) ? entrada.join(" ") : entrada ?? "";
    const haystack = normalize(plano);

    const out = new Set();
    for (const [normCity, canonical] of CANON_BY_NORM.entries()) {
        if (haystack.includes(normCity)) out.add(canonical);
    }
    return [...out];
}
