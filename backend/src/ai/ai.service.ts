import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Note, Category } from '@prisma/client';
import axios from 'axios';

export const AiAnalysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
  category: z.nativeEnum(Category),
  content: z.string().optional(),
});

export type AiAnalysis = z.infer<typeof AiAnalysisSchema>;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: GoogleGenAI;

  constructor() {
    // Initialize the new Google Gen AI SDK
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
      httpOptions: process.env.GEMINI_API_BASE_URL
        ? { baseUrl: process.env.GEMINI_API_BASE_URL }
        : undefined,
    });
  }

  private async callGroq(
    systemInstruction: string,
    prompt: string,
    jsonMode = false,
    image?: { data: Buffer; mimeType: string }
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    this.logger.log(`Calling Groq API...`);

    const messages: any[] = [
      { role: 'system', content: systemInstruction }
    ];

    if (image) {
      // Groq vision: try llama-4-scout-17b-16e-instruct with base64
      // then fallback to llama-3.1-8b-instant with OCR prompt only
      try {
        const visionModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${image.mimeType};base64,${image.data.toString('base64')}`
              }
            }
          ]
        });
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          { model: visionModel, messages, response_format: jsonMode ? { type: 'json_object' } : undefined, temperature: 0.2 },
          { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        return response.data.choices[0].message.content || '';
      } catch (visionErr) {
        const errDetail = visionErr.response?.data ? JSON.stringify(visionErr.response.data) : visionErr.message;
        this.logger.warn(`Vision model failed (${errDetail}), falling back to text-only analysis`);
        // Fallback: instruct the text model to produce a generic note
        messages.length = 1; // reset to just system message
        messages.push({
          role: 'user',
          content: `${prompt}\n\nNote: The image could not be processed directly. Please generate a generic structured note indicating that an image was uploaded but could not be read. Use category TECH.`
        });
        const fallbackResponse = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          { model: 'llama-3.1-8b-instant', messages, response_format: jsonMode ? { type: 'json_object' } : undefined, temperature: 0.2 },
          { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        return fallbackResponse.data.choices[0].message.content || '';
      }
    } else {
      messages.push({ role: 'user', content: prompt });
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        { model: 'llama-3.1-8b-instant', messages, response_format: jsonMode ? { type: 'json_object' } : undefined, temperature: 0.2 },
        { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
      );
      return response.data.choices[0].message.content || '';
    }
  }

  async analyze(content: string): Promise<AiAnalysis> {
    this.logger.log('Analyzing content...');
    try {
      let cleanText: string;

      if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
        const systemInstruction = 'You are a knowledge parsing assistant for a Second Brain application. You analyze documents and return structured JSON summaries.\n\n' +
          'IMPORTANT: The "content" field MUST be a single raw text string containing Markdown. It MUST NOT be a JSON object or JSON array.\n\n' +
          'You MUST respond with a JSON object matching the following structure:\n' +
          '{\n' +
          '  "title": "A string representing a concise title",\n' +
          '  "summary": "A string summarizing the content in 2-3 sentences",\n' +
          '  "bullets": ["An array of strings representing key bullet points/keywords"],\n' +
          '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER",\n' +
          '  "content": "A detailed Markdown document in Vietnamese explaining the core concepts. Structure it exactly as:\n\n### 💡 Phân tích & Giải thích chi tiết (5W1H)\n\n#### 1. Giải thích từ khóa & Khái niệm\n- **[Từ khóa 1]**: Giải thích chi tiết theo 5W1H (Who - Ai liên quan/sử dụng, What - Nó là gì, Where - Áp dụng ở đâu, When - Khi nào cần, Why - Tại sao quan trọng, How - Cách thức hoạt động). Giữ nguyên thuật ngữ tiếng Anh, viết giải thích bằng tiếng Việt.\n- **[Từ khóa 2]**: Giải thích chi tiết theo 5W1H...\n\n#### 2. Phân tích mối quan hệ\n- [Giải thích chi tiết mối quan hệ giữa các khái niệm, ví dụ tại sao vai trò này lại là sự kết hợp của các vai trò kia, hoặc cách chúng bổ trợ cho nhau]."\n' +
          '}';
        const prompt = `Analyze the following document and extract its key information. Ensure you choose the most relevant category from: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER.\n\nDocument Content:\n${content}`;
        cleanText = await this.callGroq(systemInstruction, prompt, true);
      } else {
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Analyze the following document and extract its key information. Ensure you choose the most relevant category from: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER.\n\nDocument Content:\n${content}`,
          config: {
            systemInstruction: 'You are a knowledge parsing assistant for a Second Brain application. You analyze documents and return structured JSON summaries.\n\n' +
              'IMPORTANT: The "content" field MUST be a single raw text string containing Markdown. It MUST NOT be a JSON object or JSON array.\n\n' +
              'You MUST respond with a JSON object matching the following structure:\n' +
              '{\n' +
              '  "title": "A string representing a concise title",\n' +
              '  "summary": "A string summarizing the content in 2-3 sentences",\n' +
              '  "bullets": ["An array of strings representing key bullet points/keywords"],\n' +
              '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER",\n' +
              '  "content": "A detailed Markdown document in Vietnamese explaining the core concepts. Structure it exactly as:\n\n### 💡 Phân tích & Giải thích chi tiết (5W1H)\n\n#### 1. Giải thích từ khóa & Khái niệm\n- **[Từ khóa 1]**: Giải thích chi tiết theo 5W1H (Who - Ai liên quan/sử dụng, What - Nó là gì, Where - Áp dụng ở đâu, When - Khi nào cần, Why - Tại sao quan trọng, How - Cách thức hoạt động). Giữ nguyên thuật ngữ tiếng Anh, viết giải thích bằng tiếng Việt.\n- **[Từ khóa 2]**: Giải thích chi tiết theo 5W1H...\n\n#### 2. Phân tích mối quan hệ\n- [Giải thích chi tiết mối quan hệ giữa các khái niệm, ví dụ tại sao vai trò này lại là sự kết hợp của các vai trò kia, hoặc cách chúng bổ trợ cho nhau]."\n' +
              '}',
            responseMimeType: 'application/json',
            responseSchema: zodToJsonSchema(AiAnalysisSchema as any) as any,
          },
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error('Gemini API returned empty response');
        }

        cleanText = responseText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
        }
      }

      const analysis = JSON.parse(cleanText);
      if (analysis && typeof analysis.content === 'object' && analysis.content !== null) {
        analysis.content = convertObjectToMarkdown(analysis.content);
      }
      try {
        return AiAnalysisSchema.parse(analysis);
      } catch (validationError) {
        this.logger.error(`Validation failed. Raw JSON response: ${cleanText}`);
        throw validationError;
      }
    } catch (error) {
      this.logger.error(`Analysis failed: ${error.message}`);
      throw error;
    }
  }

  async analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<AiAnalysis> {
    this.logger.log(`Analyzing image (${mimeType})...`);
    try {
      let cleanText: string;

      if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
        const systemInstruction = 'You are a meticulous knowledge extraction assistant for a Second Brain application.\n\n' +
          'IMPORTANT: The "content" field MUST be a single raw text string containing Markdown. It MUST NOT be a JSON object or JSON array.\n\n' +
          'Your job is to READ EVERY WORD visible in the image and extract ALL content in full detail.\n' +
          'Rules:\n' +
          '- Keep ALL technical terms, algorithm names, framework names, and proper nouns in ENGLISH (do not translate them).\n' +
          '- Write explanations, summaries, and descriptions in Vietnamese.\n' +
          '- For the "content" field: produce a COMPLETE Markdown document in Vietnamese containing the extracted text followed by 5W1H keyword analysis and visual diagram analysis. Structure it exactly as:\n\n### 🖼️ Nội dung trích xuất từ ảnh\n[Văn bản, nhãn, số liệu chi tiết trích xuất từ ảnh]\n\n---\n\n### 💡 Phân tích & Giải thích chi tiết (5W1H)\n\n#### 1. Giải thích từ khóa & Khái niệm\n- **[Từ khóa 1]**: Giải thích chi tiết theo 5W1H (Who - Ai liên quan/sử dụng, What - Nó là gì, Where - Áp dụng ở đâu, When - Khi nào cần, Why - Tại sao quan trọng, How - Cách thức hoạt động). Giữ nguyên thuật ngữ tiếng Anh, viết giải thích bằng tiếng Việt.\n- **[Từ khóa 2]**: Giải thích chi tiết theo 5W1H...\n\n#### 2. Phân tích sơ đồ & Hình ảnh (Visual & Diagram Analysis)\n- [Giải thích chi tiết các mối quan hệ cấu trúc, luồng hoặc biểu đồ trong ảnh. Ví dụ: Nếu là sơ đồ Venn, giải thích chi tiết tại sao phần giao nhau (ví dụ: Forward Deployed Engineer) lại là sự kết hợp của các vòng tròn bên ngoài (Platform Engineer, Software Engineer, Solutions Architect) và vai trò đó thừa hưởng, bổ sung năng lực gì từ các vai trò gốc].\n' +
          '- For the "bullets" field: list every key fact, metric, or concept shown (e.g. "Binary Search: O(log n)").\n\n' +
          'You MUST respond with a JSON object matching the following structure:\n' +
          '{\n' +
          '  "title": "Concise title of the image content (Vietnamese ok)",\n' +
          '  "summary": "2-3 câu tóm tắt nội dung bức ảnh bằng tiếng Việt, giữ thuật ngữ kỹ thuật tiếng Anh",\n' +
          '  "bullets": ["Mỗi bullet là một thông tin CỤ THỂ trích từ ảnh"],\n' +
          '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER",\n' +
          '  "content": "Nội dung Markdown đầy đủ theo cấu trúc đã hướng dẫn ở trên."\n' +
          '}';
        const prompt = 'Please read EVERY piece of text visible in this image carefully. Extract and reproduce ALL content — every heading, sub-heading, bullet point, number, statistic, label, and description. Do not skip anything. Write explanations in Vietnamese but keep all technical terms in English.';
        cleanText = await this.callGroq(systemInstruction, prompt, true, { data: imageBuffer, mimeType });
      } else {
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimeType,
              },
            },
            'Please read EVERY piece of text visible in this image carefully. Extract and reproduce ALL content — every heading, sub-heading, bullet point, number, statistic, label, and description. Do not skip anything. Write explanations in Vietnamese but keep all technical terms in English.',
          ],
          config: {
            systemInstruction: 'You are a meticulous knowledge extraction assistant for a Second Brain application.\n\n' +
              'IMPORTANT: The "content" field MUST be a single raw text string containing Markdown. It MUST NOT be a JSON object or JSON array.\n\n' +
              'Your job is to READ EVERY WORD visible in the image and extract ALL content in full detail.\n' +
              'Rules:\n' +
              '- Keep ALL technical terms, algorithm names, framework names, and proper nouns in ENGLISH (do not translate them).\n' +
              '- Write explanations, summaries, and descriptions in Vietnamese.\n' +
              '- For the "content" field: produce a COMPLETE Markdown document in Vietnamese containing the extracted text followed by 5W1H keyword analysis and visual diagram analysis. Structure it exactly as:\n\n### 🖼️ Nội dung trích xuất từ ảnh\n[Văn bản, nhãn, số liệu chi tiết trích xuất từ ảnh]\n\n---\n\n### 💡 Phân tích & Giải thích chi tiết (5W1H)\n\n#### 1. Giải thích từ khóa & Khái niệm\n- **[Từ khóa 1]**: Giải thích chi tiết theo 5W1H (Who - Ai liên quan/sử dụng, What - Nó là gì, Where - Áp dụng ở đâu, When - Khi nào cần, Why - Tại sao quan trọng, How - Cách thức hoạt động). Giữ nguyên thuật ngữ tiếng Anh, viết giải thích bằng tiếng Việt.\n- **[Từ khóa 2]**: Giải thích chi tiết theo 5W1H...\n\n#### 2. Phân tích sơ đồ & Hình ảnh (Visual & Diagram Analysis)\n- [Giải thích chi tiết các mối quan hệ cấu trúc, luồng hoặc biểu đồ trong ảnh. Ví dụ: Nếu là sơ đồ Venn, giải thích chi tiết tại sao phần giao nhau (ví dụ: Forward Deployed Engineer) lại là sự kết hợp của các vòng tròn bên ngoài (Platform Engineer, Software Engineer, Solutions Architect) và vai trò đó thừa hưởng, bổ sung năng lực gì từ các vai trò gốc].\n',
            responseMimeType: 'application/json',
            responseSchema: zodToJsonSchema(AiAnalysisSchema as any) as any,
          },
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error('Gemini API returned empty response');
        }

        cleanText = responseText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
        }
      }

      const analysis = JSON.parse(cleanText);
      if (analysis && typeof analysis.content === 'object' && analysis.content !== null) {
        analysis.content = convertObjectToMarkdown(analysis.content);
      }
      try {
        return AiAnalysisSchema.parse(analysis);
      } catch (validationError) {
        this.logger.error(`Validation failed. Raw JSON response: ${cleanText}`);
        throw validationError;
      }
    } catch (error) {
      this.logger.error(`Image analysis failed: ${error.message}`);
      throw error;
    }
  }

  async answerQuestion(query: string, notes: Note[]): Promise<string> {
    this.logger.log('Answering question...');
    try {
      const notesContext = notes
        .map((n, i) => `[Note #${i + 1}] Title: ${n.aiTitle}\nCategory: ${n.category}\nContent:\n${n.content}`)
        .join('\n\n---\n\n');

      if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
        const systemInstruction = "You are an intelligent Second Brain assistant. Answer the user's question based on the provided notes context. Be concise and professional.";
        const prompt = `I have the following notes stored in my Second Brain:\n\n${notesContext}\n\nBased on these notes, please answer my question: "${query}"`;
        return await this.callGroq(systemInstruction, prompt, false);
      } else {
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `I have the following notes stored in my Second Brain:\n\n${notesContext}\n\nBased on these notes, please answer my question: "${query}"`,
          config: {
            systemInstruction: "You are an intelligent Second Brain assistant. Answer the user's question based on the provided notes context. Be concise and professional.",
          },
        });

        return response.text || 'No answer could be generated.';
      }
    } catch (error) {
      this.logger.error(`Question answering failed: ${error.message}`);
      return `Sorry, I encountered an error while trying to answer your question: ${error.message}`;
    }
  }
}

function convertObjectToMarkdown(obj: any, depth = 0): string {
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object' || obj === null) return String(obj);
  if (Array.isArray(obj)) {
    return obj.map(item => `${'  '.repeat(depth)}- ${convertObjectToMarkdown(item, depth + 1)}`).join('\n');
  }
  return Object.entries(obj)
    .map(([key, val]) => {
      const headingPrefix = depth === 0 ? '### ' : depth === 1 ? '#### ' : '';
      if (typeof val === 'object' && val !== null) {
        return `${headingPrefix}${key}\n${convertObjectToMarkdown(val, depth + 1)}`;
      }
      return `${headingPrefix}${key}: ${val}`;
    })
    .join('\n\n');
}
