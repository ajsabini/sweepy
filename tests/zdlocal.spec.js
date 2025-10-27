const { test, expect } = require("@playwright/test");
const { extraerTecnologias } = require("./utils/tecnologias");
const { guardarJSON } = require("./utils/guardarJSON");
const { extraerPaises } = require("./utils/paises");

test("Obtener requisitos desde API interna de dLocal", async ({ request }) => {
    const id = "18479403-13dd-4206-8372-a3786cd5adcd"; // ID del trabajo
    const url = `https://dlocal--careers.multiscreensite.com/rts/collections/public/6a366ace/runtime/collection/All%20Job%20Openings/data?filters=%7B%22field%22%3A%22id%22%2C%22operator%22%3A%22EQ%22%2C%22value%22%3A%22${id}%22%7D&fields=lists&fields=salaryRange&fields=salaryDescription&language=ENGLISH`;

    const response = await request.get(url);
    const json = await response.json();

    const requisitos = json?.values?.[0]?.data?.lists || [];

    for (const req of requisitos) {
        console.log("🟩 Título:", req.text);
        console.log("📝 HTML de la lista:", req.content);
        console.log("🔹 Ítems:");
        const match = req.content.match(/<li>(.*?)<\/li>/g);
        if (match) {
            const items = match.map((item) => item.replace(/<\/?li>/g, "").trim());
            console.log(items);
        }
        console.log("----------------------------");
    }
});
