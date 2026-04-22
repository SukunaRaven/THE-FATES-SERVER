// We koppelen de knop aan de functie zodra de pagina geladen is
document.getElementById('sendBtn').addEventListener('click', ask);

// Zorg dat 'Enter' ook werkt
document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') ask();
});

async function ask() {
    const input = document.getElementById('userInput');
    const chat = document.getElementById('chatbox');
    const message = input.value.trim();

    if (!message) return;

    // Toon bericht van de gebruiker
    chat.innerHTML += `<div class="user-msg"><b>Gij:</b> ${message}</div>`;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    try {
        console.log("Verbinding maken met server...");
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!res.ok) throw new Error("Server reageert niet");

        const data = await res.json();
        console.log("Data ontvangen:", data);

        // Markdown renderen (Criterium: Expert)
        const renderedMessage = marked.parse(data.message);

        let html = `<div class="fate-msg">
            <b>The Fates:</b> 
            <div>${renderedMessage}</div>`;

        if (data.image) {
            html += `<img src="${data.image}" class="myth-img" alt="${message}">`;
        }

        html += `<br><small><i>Bron: ${data.source}</i></small></div>`;

        chat.innerHTML += html;
        chat.scrollTop = chat.scrollHeight;

    } catch (err) {
        console.error("Fout:", err);
        chat.innerHTML += `<div class="error-msg">De draden van het lot zijn verstrikt (Server Fout).</div>`;
    }
}