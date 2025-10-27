const DEPARTAMENTOS = [
    "Montevideo",
    "Maldonado",
    "Rocha",
    "Treinta y Tres",
    "Cerro Largo",
    "Rivera",
    "Artigas",
    "Salto",
    "Paysandú",
    "Rio Negro",
    "Colonia",
    "Soriano",
    "San José",
    "Canelones",
    "Lavalleja",
    "Florida",
    "Tacuarembó",
    "Flores",
    "Durazno",
];

const normalize = (s) =>
    String(s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // sin acentos
        .replace(/\u00A0/g, " ") // NBSP -> espacio
        .toLowerCase();

const CANON_BY_NORM = new Map(DEPARTAMENTOS.map((c) => [normalize(c), c]));

/**
 * @param {string|string[]} entrada - string suelto o array de strings
 * @returns {string[]} ciudades encontradas (canónicas, sin duplicados)
 */
export function extraerDepartamentos(entrada) {
    const plano = Array.isArray(entrada) ? entrada.join(" ") : entrada ?? "";
    const haystack = normalize(plano);

    const out = new Set();
    for (const [normCity, canonical] of CANON_BY_NORM.entries()) {
        if (haystack.includes(normCity)) out.add(canonical);
    }
    return [...out];
}
