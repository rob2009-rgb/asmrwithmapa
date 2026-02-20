
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs");

async function testFinalModel() {
    try {
        const envPath = path.resolve(__dirname, ".env.local");
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
        const apiKey = match[1].trim();
        const genAI = new GoogleGenerativeAI(apiKey);

        const modelName = "gemini-2.5-flash";
        console.log(`Testing ${modelName}...`);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello Mapa!");
        const text = result.response.text();
        console.log(`✅ SUCCESS: ${text.substring(0, 50)}...`);

    } catch (err) {
        console.error(`❌ FAILED: ${err.message}`);
    }
}

testFinalModel();
