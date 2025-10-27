const PAISES = [
    "uruguay",
    "argentina",
    "brasil",
    "madrid",
    "montevideo",
    "barcelona",
    "buenos aires",
    "brazil",
    "spain",
    "córdoba",
];

const extraerPaises = (entrada) => {
    const encontrados = new Set();

    const textoPlano = Array.isArray(entrada) ? entrada.join(" ").toLowerCase() : (entrada || "").toLowerCase();

    for (const pais of PAISES) {
        if (textoPlano.includes(pais)) {
            encontrados.add(pais);
        }
    }

    return Array.from(encontrados);
};

module.exports = {
    extraerPaises,
};
