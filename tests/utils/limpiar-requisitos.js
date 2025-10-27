const LIMPIARREQUISITOS = [
    "Core technologies:",
    "Infrastructure & deployment:",
    "Advanced design & architecture concepts:",
];

const limpiarRequisitos = (textos) => {
    return textos.filter((linea) => {
        return !LIMPIARREQUISITOS.some((titulo) => linea.toLowerCase().startsWith(titulo.toLowerCase()));
    });
};

module.exports = {
    limpiarRequisitos,
};
