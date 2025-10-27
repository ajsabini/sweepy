const FRAMEWORKS = [
    "json",
    "php",
    "javascript",
    "pyspark",
    "mysql",
    "java",
    "sql",
    "c#",
    "python",
    "xml",
    "powershell",
    "shell script",
    "nosql",
    "html5",
    "css3",
];

const extraerFrameworks = (textos) => {
    const encontrados = new Set();

    for (const linea of textos) {
        const texto = linea.toLowerCase();
        for (const tec of FRAMEWORKS) {
            if (texto.includes(tec)) {
                encontrados.add(tec);
            }
        }
    }

    return Array.from(encontrados);
};

module.exports = {
    extraerFrameworks,
};
