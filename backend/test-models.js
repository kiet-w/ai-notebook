const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.list();
    console.log(response.map(m => m.name));
  } catch(e) {
    console.error(e.message);
  }
}
run();
