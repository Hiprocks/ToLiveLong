const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

async function test() {
    try {
        const envPath = path.resolve(process.cwd(), ".env.local");
        if (!fs.existsSync(envPath)) {
            console.error("❌ .env.local file not found!");
            return;
        }

        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);

        if (!match || !match[1]) {
            console.error("❌ GEMINI_API_KEY not found in .env.local");
            return;
        }

        const apiKey = match[1].trim();
        const genAI = new GoogleGenerativeAI(apiKey);

        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

        for (const modelName of modelsToTry) {
            console.log(`\n🔄 Testing model: ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log(`✅ Success with ${modelName}!`);
                console.log("Response:", response.text());
                return; // Exit on first success
            } catch (e) {
                console.error(`❌ Failed with ${modelName}: ${e.message}`);
            }
        }

        console.error("\n❌ All models failed.");

    } catch (error) {
        console.error("❌ Script Error:", error);
    }
}

test();
