import express from "express";
import { model } from "./agent.js";
import { retrieve, getMythData } from "./tools.js";

const app = express();
app.use(express.json());
app.use(express.static('public'));

let chatHistory = [];

app.post('/chat', async (req, res) => {
    const { message } = req.body;
    console.log(`--- NIEUWE VRAAG: ${message} ---`);

    try {
        const context = await retrieve(message);
        console.log(context ? "Documenten gevonden." : "Geen relevante context.");

        const response = await model.invoke([
            ["system", `Jij bent 'The Fates'. Antwoord mystiek en plechtig. 
            Gebruik uitsluitend deze context: ${context}. 

            REGEL VOOR AFBEELDINGEN:
            Alleen als de gebruiker expliciet vraagt om een afbeelding, een foto, een visioen of hoe iemand eruitziet, MOET je eindigen op een nieuwe regel met exact: NAME: [Naam]
            
            Als de gebruiker een gewone vraag stelt zonder om beeld te vragen, gebruik de NAME tag dan NIET.`],
            ...chatHistory,
            ["user", message]
        ]);

        chatHistory.push(["user", message]);
        chatHistory.push(["assistant", response.content]);
        if (chatHistory.length > 10) chatHistory.shift();

        let displayMessage = response.content;
        let imageUrl = "";
        let toolUsed = "FAISS Retrieval";

        const nameMatch = displayMessage.match(/NAME:\s*\[?([\w\s]+)]?/i);

        if (nameMatch) {
            const fullNameTag = nameMatch[0];
            const name = nameMatch[1].trim();

            displayMessage = displayMessage.replace(fullNameTag, "").trim();
            console.log(`Tool check getriggerd voor: ${name}...`);

            const apiData = await getMythData("gods", name);

            if (apiData && apiData.image) {
                imageUrl = `https://thegreekmythapi.vercel.app${apiData.image}`;
                toolUsed += " & Greek Myth API";

                displayMessage += `\n\n**Goddelijke feiten (API):**\n`;
                displayMessage += `* **Beschrijving:** ${apiData.description}\n`;
                displayMessage += `* **Krachten:** ${apiData.attributes?.powers?.join(", ") || "Zie rollen"}`;
            } else {
                imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}.jpg`;
                console.log("Fallback naar Wikimedia voor:", name);
                toolUsed += " & Wikimedia Fallback";
            }
        }

        res.json({
            message: displayMessage,
            image: imageUrl,
            source: `De oude rollen: ${toolUsed}`,
            debugInfo: `Gebruikte tools: ${toolUsed}`
        });

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ error: "De draden zijn verstrikt." });
    }
});

app.listen(3000, () => console.log("Het Orakel spreekt op poort 3000"));