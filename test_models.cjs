
const path = require("path");
const fs = require("fs");

async function listModels() {
    try {
        const envPath = path.resolve(__dirname, ".env.local");
        if (!fs.existsSync(envPath)) {
            console.error(".env.local not found");
            return;
        }
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);

        if (!match) {
            console.error("API Key not found in .env.local");
            return;
        }

        const apiKey = match[1].trim();

        console.log("--- Fetching models via REST ---");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (${m.displayName})`);
            });
        } else {
            console.log("No models returned. Response:", JSON.stringify(data, null, 2));
        }

    } catch (err) {
        console.error("REST Diagnostic failed:", err);
    }
}

listModels();
