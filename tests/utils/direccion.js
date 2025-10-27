export function direccionAntesDeComa(input) {
    if (input == null) return null;
    const clean = (s) =>
        String(s)
            .replace(/\u00A0/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    const s = clean(input);
    const i = s.indexOf(",");
    return clean(i === -1 ? s : s.slice(0, i));
}

export function extraerDirecciones(locales = []) {
    return (locales || []).map(direccionAntesDeComa).filter(Boolean);
}
