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
          'You MUST respond with a JSON object matching the following structure:\n' +
          '{\n' +
          '  "title": "A string representing a concise title",\n' +
          '  "summary": "A string summarizing the content in 2-3 sentences",\n' +
          '  "bullets": ["An array of strings representing key bullet points"],\n' +
          '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER"\n' +
          '}';
        const prompt = `Analyze the following document and extract its key information. Ensure you choose the most relevant category from: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER.\n\nDocument Content:\n${content}`;
        cleanText = await this.callGroq(systemInstruction, prompt, true);
      } else {
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Analyze the following document and extract its key information. Ensure you choose the most relevant category from: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER.\n\nDocument Content:\n${content}`,
          config: {
            systemInstruction: 'You are a knowledge parsing assistant for a Second Brain application. You analyze documents and return structured JSON summaries.\n\n' +
              'You MUST respond with a JSON object matching the following structure:\n' +
              '{\n' +
              '  "title": "A string representing a concise title",\n' +
              '  "summary": "A string summarizing the content in 2-3 sentences",\n' +
              '  "bullets": ["An array of strings representing key bullet points"],\n' +
              '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER"\n' +
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
          'Your job is to READ EVERY WORD visible in the image and extract ALL content in full detail.\n' +
          'Rules:\n' +
          '- Keep ALL technical terms, algorithm names, framework names, and proper nouns in ENGLISH (do not translate them).\n' +
          '- Write explanations, summaries, and descriptions in Vietnamese.\n' +
          '- For the "content" field: produce a COMPLETE Markdown document that faithfully reproduces every heading, sub-heading, bullet point, statistic, and label visible in the image. Do NOT summarize — transcribe everything.\n' +
          '- For the "bullets" field: list every key fact, metric, or concept shown (e.g. "Binary Search: O(log n), ~7 comparisons for 100 elements").\n\n' +
          'You MUST respond with a JSON object matching the following structure:\n' +
          '{\n' +
          '  "title": "Concise title of the image content (Vietnamese ok)",\n' +
          '  "summary": "2-3 câu tóm tắt nội dung bức ảnh bằng tiếng Việt, giữ thuật ngữ kỹ thuật tiếng Anh",\n' +
          '  "bullets": ["Mỗi bullet là một thông tin CỤ THỂ trích từ ảnh, ví dụ: Binary Search: O(log n) time complexity, ~7 comparisons for 100 elements"],\n' +
          '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER",\n' +
          '  "content": "Toàn bộ nội dung ảnh được viết lại hoàn chỉnh bằng Markdown. Dùng ## cho tiêu đề lớn, ### cho tiêu đề nhỏ, - cho bullet. Giữ nguyên thuật ngữ kỹ thuật tiếng Anh. Giải thích từng mục bằng tiếng Việt."\n' +
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
              'Your job is to READ EVERY WORD visible in the image and extract ALL content in full detail.\n' +
              'Rules:\n' +
              '- Keep ALL technical terms, algorithm names, framework names, and proper nouns in ENGLISH.\n' +
              '- Write explanations and descriptions in Vietnamese.\n' +
              '- For the "content" field: produce a COMPLETE Markdown document that faithfully reproduces every heading, sub-heading, bullet point, statistic, and label visible in the image. Do NOT summarize — transcribe everything and explain each item in Vietnamese.\n' +
              '- For the "bullets" field: list every key fact, metric, or concept shown with its specific details.\n\n' +
              'You MUST respond with a JSON object matching the following structure:\n' +
              '{\n' +
              '  "title": "Tiêu đề ngắn gọn của nội dung ảnh",\n' +
              '  "summary": "2-3 câu tóm tắt nội dung bức ảnh bằng tiếng Việt, giữ thuật ngữ kỹ thuật tiếng Anh",\n' +
              '  "bullets": ["Mỗi bullet là một thông tin CỤ THỂ trích từ ảnh với đầy đủ số liệu, ví dụ: Binary Search: O(log n) time complexity, ~7 comparisons for 100 elements"],\n' +
              '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER",\n' +
              '  "content": "Toàn bộ nội dung ảnh viết lại hoàn chỉnh bằng Markdown với ## tiêu đề lớn, ### tiêu đề nhỏ, bullet points. Giữ nguyên thuật ngữ kỹ thuật. Giải thích từng mục bằng tiếng Việt."\n' +
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
