import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: process.env.GEMINI_API_BASE_URL
        ? { baseUrl: process.env.GEMINI_API_BASE_URL }
        : undefined,
    });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: "Hello" }] }],
    });
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
test();
