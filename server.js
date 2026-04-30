import express from "express";
import { model } from "./agent.js";
import { retrieve, getMythImage, getMythData } from "./tools.js";

const app = express();
app.use(express.json());
app.use(express.static('public'));

let chatHistory = [];

app.post('/chat', async (req, res) => {
    const { message } = req.body;
    console.log(`--- NIEUWE VRAAG: ${message} ---`);

    try {
        const context = await retrieve(message);
        console.log(context ? "Documenten gevonden." : "⚠ Geen relevante context.");

        const response = await model.invoke([
            ["system", `Jij bent 'The Fates'. Antwoord mystiek en plechtig. 
            Gebruik uitsluitend deze context: ${context}. 
            Als de info er niet is, zeg dat de schatkamers van Olympus deze kennis niet bevatten.
            
            BELANGRIJKE REGEL:
            Als de gebruiker vraagt om een afbeelding, gebruik dan de specifieke naam van de god waar de vraag over gaat (bijv. Zeus, Athena, Poseidon) voor de NAME: tag. Gebruik NOOIT 'The Fates' als naam voor de tool.
            Voorbeeld: "Aanschouw de bliksem. \nNAME: [Zeus]"`],
            ...chatHistory,
            ["user", message]
        ]);

        chatHistory.push(["user", message]);
        chatHistory.push(["assistant", response.content]);
        if (chatHistory.length > 10) chatHistory.shift();

        let displayMessage = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        let imageUrl = "";
        let toolUsed = "FAISS Retrieval";

        const nameMatch = displayMessage.match(/NAME:\s*\[?([\w\s]+)\]?/i);

        if (nameMatch) {
            const fullNameTag = nameMatch[0];
            const name = nameMatch[1].trim();

            displayMessage = displayMessage.replace(fullNameTag, "").trim();

            console.log(`Tool check: Gegevens ophalen voor ${name}...`);

            const apiData = await getMythData("gods", name);

            if (apiData) {
                imageUrl = apiData.image || `https://thegreekmythapi.vercel.app/api/gods/${encodeURIComponent(name.toLowerCase())}.png`;
                toolUsed += " & Greek Myth API";

                displayMessage += `\n\n**Goddelijke feiten (API):**\n`;
                displayMessage += `* **Krachten:** ${apiData.powers?.join(", ") || "Onbekend"}\n`;
                displayMessage += `* **Attributen:** ${apiData.attributes?.join(", ") || "Geen"}`;
            } else {
                imageUrl = `https://thegreekmythapi.vercel.app/api/gods/${encodeURIComponent(name.toLowerCase())}.png`;
                console.log("Geen API data, fallback naar directe URL.");
            }
        }

        res.json({
            message: displayMessage,
            image: imageUrl,
            source: "De Oude Rollen (FAISS Index)",
            debugInfo: `Gebruikte tools: ${toolUsed}`
        });

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ error: "De draden zijn verstrikt." });
    }
});

app.listen(3000, () => console.log("Het Orakel spreekt op poort 3000"));