// utils/guardarJSON.js
const fs = require("fs");
const path = require("path");

const guardarJSON = (nombreArchivo, datos) => {
    const ruta = path.resolve(__dirname, "..", "output", nombreArchivo);

    // Asegura que la carpeta output exista
    fs.mkdirSync(path.dirname(ruta), { recursive: true });

    fs.writeFileSync(ruta, JSON.stringify(datos, null, 2), "utf-8");
    console.log(`Archivo guardado como ${ruta}`);
};

module.exports = { guardarJSON };
