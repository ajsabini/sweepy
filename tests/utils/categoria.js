export function extraerDespuesDeEn(categoria) {
    if (categoria == null) return null;
    const s = String(categoria)
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const m = s.match(/\ben\b\s+(.+)/i); // “en” como palabra + lo que sigue
    return m ? m[1].trim() : null;
}
