/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/restrict-template-expressions */
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

// Schema riêng cho luồng metadata (nhẹ, nhanh) — KHÔNG chứa content
export const AiMetadataSchema = z.object({
  title: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
  category: z.nativeEnum(Category),
});

export type AiMetadata = z.infer<typeof AiMetadataSchema>;

// Mức độ chi tiết mà user có thể chọn khi tạo note
export type DetailLevel = 'short' | 'medium' | 'long';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      this.logger.warn(
        'GEMINI_API_KEY is not set. Gemini API calls will fail.',
      );
    }
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: process.env.GEMINI_API_BASE_URL
        ? { baseUrl: process.env.GEMINI_API_BASE_URL }
        : undefined,
    });
  }

  // ────────────────────────────────────────────────────────────
  // METADATA — luôn giữ nhẹ, không phụ thuộc category/độ dài
  // ────────────────────────────────────────────────────────────

  private buildMetadataSystemInstruction(): string {
    return (
      'You are a knowledge parsing assistant for a Second Brain application. You analyze documents and return structured JSON summaries.\n\n' +
      'You MUST respond with a JSON object matching the following structure:\n' +
      '{\n' +
      '  "title": "A string representing a concise title",\n' +
      '  "summary": "A string summarizing the content in 2-3 sentences",\n' +
      '  "bullets": ["An array of strings representing key bullet points/keywords"],\n' +
      '  "category": "Must be one of: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER"\n' +
      '}'
    );
  }

  private buildAnalyzePrompt(content: string): string {
    return `Analyze the following document and extract its key information. Ensure you choose the most relevant category from: COOKING, TECH, LEARNING, WORK, FINANCE, OTHER.\n\nDocument Content:\n${content}`;
  }

  // ────────────────────────────────────────────────────────────
  // CONTENT — linh hoạt theo category (khung khác nhau) + độ dài
  // ────────────────────────────────────────────────────────────

  private getStructureForCategory(category: Category | null): string {
    switch (category) {
      case 'COOKING':
        return (
          '### 🍳 Công thức & Nguyên liệu\n' +
          '- Liệt kê đầy đủ nguyên liệu với số lượng cụ thể (nếu có trong nội dung gốc)\n\n' +
          '### 👨🍳 Các bước thực hiện\n' +
          '- Trình bày từng bước theo thứ tự, rõ ràng, dễ làm theo\n\n' +
          '### 💡 Mẹo & Lưu ý\n' +
          '- Các mẹo hay, lưu ý quan trọng, biến thể có thể áp dụng'
        );
      case 'WORK':
        return (
          '### 🎯 Mục tiêu chính\n' +
          '- Tóm tắt mục tiêu/yêu cầu công việc\n\n' +
          '### ✅ Việc cần làm\n' +
          '- Danh sách hành động cụ thể, có thể theo dõi tiến độ\n\n' +
          '### ⏰ Deadline & Ưu tiên\n' +
          '- Thời hạn, mức độ ưu tiên nếu có đề cập'
        );
      case 'FINANCE':
        return (
          '### 📊 Số liệu chính\n' +
          '- Các con số, chỉ số quan trọng được đề cập\n\n' +
          '### 🔍 Phân tích\n' +
          '- Giải thích ý nghĩa của số liệu, xu hướng, so sánh nếu có\n\n' +
          '### 💰 Khuyến nghị / Kết luận\n' +
          '- Nhận định hoặc hành động nên cân nhắc'
        );
      case 'TECH':
      case 'LEARNING':
        return (
          '### 💡 Phân tích & Giải thích chi tiết (5W1H)\n\n' +
          '#### 1. Giải thích từ khóa & Khái niệm\n' +
          '- **[Từ khóa]**: Giải thích theo 5W1H (Who - Ai liên quan/sử dụng, What - Nó là gì, Where - Áp dụng ở đâu, When - Khi nào cần, Why - Tại sao quan trọng, How - Cách thức hoạt động). Giữ nguyên thuật ngữ tiếng Anh, viết giải thích bằng tiếng Việt.\n\n' +
          '#### 2. Phân tích mối quan hệ\n' +
          '- Giải thích mối quan hệ giữa các khái niệm, cách chúng bổ trợ cho nhau và ứng dụng thực tế.'
        );
      default:
        return (
          '### 📝 Tóm tắt nội dung\n' +
          '- Trình bày lại nội dung chính một cách mạch lạc, dễ hiểu\n\n' +
          '### 💡 Điểm đáng chú ý\n' +
          '- Những điểm quan trọng, thú vị, hoặc cần lưu ý'
        );
    }
  }

  private getLengthGuidance(level: DetailLevel): string {
    switch (level) {
      case 'short':
        return 'Viết ngắn gọn, súc tích. Mỗi mục chỉ 1-2 câu, tổng thể khoảng 100-200 từ. Ưu tiên thông tin cốt lõi, bỏ qua chi tiết phụ.';
      case 'long':
        return 'Viết chi tiết, đầy đủ, đào sâu. Mỗi mục nên có 4-6 câu giải thích cặn kẽ, tổng thể khoảng 500-800 từ. Bổ sung ví dụ hoặc liên hệ thực tế khi phù hợp.';
      case 'medium':
      default:
        return 'Viết vừa đủ chi tiết, rõ ràng. Mỗi mục khoảng 2-3 câu, tổng thể khoảng 250-400 từ. Cân bằng giữa đầy đủ và súc tích, không lan man.';
    }
  }

  private buildContentSystemInstruction(
    category: Category | null,
    detailLevel: DetailLevel,
  ): string {
    const structure = this.getStructureForCategory(category);
    const lengthGuidance = this.getLengthGuidance(detailLevel);

    return (
      'You are a knowledge parsing assistant for a Second Brain application. ' +
      'You write clear Vietnamese Markdown explanations of documents, adapting structure and depth to the content type.\n\n' +
      `Hướng dẫn độ dài: ${lengthGuidance}\n\n` +
      `Cấu trúc Markdown cần tuân theo (điều chỉnh nội dung bên trong cho phù hợp với tài liệu gốc, không cần giữ nguyên literal từ khóa mẫu):\n\n${structure}\n\n` +
      'Giữ nguyên thuật ngữ kỹ thuật/tên riêng bằng tiếng Anh nếu có, viết phần giải thích bằng tiếng Việt. ' +
      'Trả lời TRỰC TIẾP bằng nội dung Markdown, KHÔNG bọc trong JSON, không thêm lời dẫn hay lời kết thừa.'
    );
  }

  // ────────────────────────────────────────────────────────────
  // ẢNH
  // ────────────────────────────────────────────────────────────

  private buildImageSystemInstruction(): string {
    return (
      'You are a meticulous knowledge extraction assistant for a Second Brain application.\n\n' +
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
      '}'
    );
  }

  private buildImagePrompt(): string {
    return 'Please read EVERY piece of text visible in this image carefully. Extract and reproduce ALL content — every heading, sub-heading, bullet point, number, statistic, label, and description. Do not skip anything. Write explanations in Vietnamese but keep all technical terms in English.';
  }

  // ────────────────────────────────────────────────────────────
  // Gọi model — OpenAI-compatible (Groq/Cerebras/OpenRouter/Local LLM)
  // ────────────────────────────────────────────────────────────

  private async callOpenAICompatible(config: {
    baseUrl: string;
    apiKey: string;
    model: string;
    timeout: number;
    systemInstruction: string;
    prompt: string;
    jsonMode?: boolean;
    image?: { data: Buffer; mimeType: string };
    visionFallback?: { model: string; fallbackPrompt: string };
  }): Promise<string> {
    this.logger.log(
      `Calling API at ${config.baseUrl} with model ${config.model}...`,
    );

    const messages: any[] = [
      { role: 'system', content: config.systemInstruction },
    ];

    if (config.image) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: config.prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${config.image.mimeType};base64,${config.image.data.toString('base64')}`,
            },
          },
        ],
      });

      try {
        const response = await axios.post(
          `${config.baseUrl}/chat/completions`,
          {
            model: config.model,
            messages,
            response_format: config.jsonMode
              ? { type: 'json_object' }
              : undefined,
            temperature: 0.2,
          },
          {
            headers: {
              ...(config.apiKey
                ? { Authorization: `Bearer ${config.apiKey}` }
                : {}),
              'Content-Type': 'application/json',
            },
            timeout: config.timeout,
          },
        );
        return response.data.choices[0].message.content || '';
      } catch (visionErr: any) {
        if (config.visionFallback) {
          const errDetail = visionErr.response?.data
            ? JSON.stringify(visionErr.response.data)
            : visionErr.message;
          this.logger.warn(
            `Vision model failed (${errDetail}), falling back to text-only analysis`,
          );

          messages.length = 1;
          messages.push({
            role: 'user',
            content: config.visionFallback.fallbackPrompt,
          });
          const fallbackResponse = await axios.post(
            `${config.baseUrl}/chat/completions`,
            {
              model: config.visionFallback.model,
              messages,
              response_format: config.jsonMode
                ? { type: 'json_object' }
                : undefined,
              temperature: 0.2,
            },
            {
              headers: {
                ...(config.apiKey
                  ? { Authorization: `Bearer ${config.apiKey}` }
                  : {}),
                'Content-Type': 'application/json',
              },
              timeout: config.timeout,
            },
          );
          return fallbackResponse.data.choices[0].message.content || '';
        } else {
          throw visionErr;
        }
      }
    } else {
      messages.push({ role: 'user', content: config.prompt });
      const response = await axios.post(
        `${config.baseUrl}/chat/completions`,
        {
          model: config.model,
          messages,
          response_format: config.jsonMode
            ? { type: 'json_object' }
            : undefined,
          temperature: 0.2,
        },
        {
          headers: {
            ...(config.apiKey
              ? { Authorization: `Bearer ${config.apiKey}` }
              : {}),
            'Content-Type': 'application/json',
          },
          timeout: config.timeout,
        },
      );
      return response.data.choices[0].message.content || '';
    }
  }

  private async callGemini(
    systemInstruction: string,
    prompt: string | any[],
    jsonMode: boolean,
    schemaOverride?: any,
  ): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        ...(jsonMode
          ? {
              responseMimeType: 'application/json',
              responseSchema: zodToJsonSchema(
                (schemaOverride ?? AiAnalysisSchema) as any,
              ),
            }
          : {}),
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini API returned empty response');
    }

    let cleanText = responseText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText
        .replace(/^```(?:json)?\n?/i, '')
        .replace(/\n?```$/, '')
        .trim();
    }
    return cleanText;
  }

  private parseAiResponse(cleanText: string): AiAnalysis {
    const analysis = JSON.parse(cleanText);
    if (
      analysis &&
      typeof analysis.content === 'object' &&
      analysis.content !== null
    ) {
      analysis.content = convertObjectToMarkdown(analysis.content);
    }
    try {
      return AiAnalysisSchema.parse(analysis);
    } catch (validationError) {
      this.logger.error(`Validation failed. Raw JSON response: ${cleanText}`);
      throw validationError;
    }
  }

  // ────────────────────────────────────────────────────────────
  // ANALYZE
  // ────────────────────────────────────────────────────────────

  async analyze(
    content: string,
    detailLevel: DetailLevel = 'medium',
  ): Promise<AiAnalysis> {
    this.logger.log(`Analyzing content (sequential, detail=${detailLevel})...`);
    try {
      const metadata = await this.generateMetadata(content);
      const longContent = await this.generateLongContent(
        content,
        metadata.category,
        detailLevel,
      );

      return {
        ...metadata,
        content: longContent,
      };
    } catch (error: any) {
      this.logger.error(`Analysis failed: ${error.message}`);
      throw error;
    }
  }

  async analyzeFast(
    content: string,
    detailLevel: DetailLevel = 'medium',
    guessedCategory: Category | null = null,
  ): Promise<AiAnalysis> {
    this.logger.log(
      `Analyzing content (fully parallel, detail=${detailLevel})...`,
    );
    try {
      const [metadata, longContent] = await Promise.all([
        this.generateMetadata(content),
        this.generateLongContent(content, guessedCategory, detailLevel),
      ]);

      return {
        ...metadata,
        content: longContent,
      };
    } catch (error: any) {
      this.logger.error(`Analysis failed: ${error.message}`);
      throw error;
    }
  }

  private async generateMetadata(content: string): Promise<AiMetadata> {
    const systemInstruction = this.buildMetadataSystemInstruction();
    const prompt = this.buildAnalyzePrompt(content);

    let cleanText: string;

    if (process.env.LOCAL_LLM_URL) {
      cleanText = await this.callOpenAICompatible({
        baseUrl: process.env.LOCAL_LLM_URL,
        apiKey: process.env.LOCAL_LLM_KEY || '',
        model: process.env.LOCAL_LLM_MODEL || 'llama3.2',
        timeout: 120000,
        systemInstruction,
        prompt,
        jsonMode: true,
      });
    } else if (process.env.GEMINI_API_KEY?.startsWith('sk-or-v1-')) {
      cleanText = await this.callOpenAICompatible({
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'nemotron-3-ultra-550b-a55b:free',
        timeout: 15000,
        systemInstruction,
        prompt,
        jsonMode: true,
      });
    } else if (process.env.GEMINI_API_KEY?.startsWith('csk-')) {
      cleanText = await this.callOpenAICompatible({
        baseUrl: 'https://api.cerebras.ai/v1',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'llama3.1-8b',
        timeout: 15000,
        systemInstruction,
        prompt,
        jsonMode: true,
      });
    } else if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
      cleanText = await this.callOpenAICompatible({
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'llama-3.1-8b-instant',
        timeout: 15000,
        systemInstruction,
        prompt,
        jsonMode: true,
      });
    } else {
      cleanText = await this.callGemini(
        systemInstruction,
        prompt,
        true,
        AiMetadataSchema,
      );
    }

    const parsed = JSON.parse(cleanText);
    return AiMetadataSchema.parse(parsed);
  }

  private async generateLongContent(
    content: string,
    category: Category | null,
    detailLevel: DetailLevel,
  ): Promise<string> {
    const systemInstruction = this.buildContentSystemInstruction(
      category,
      detailLevel,
    );
    const prompt = this.buildAnalyzePrompt(content);

    if (process.env.LOCAL_LLM_URL) {
      return await this.callOpenAICompatible({
        baseUrl: process.env.LOCAL_LLM_URL,
        apiKey: process.env.LOCAL_LLM_KEY || '',
        model: process.env.LOCAL_LLM_MODEL || 'llama3.2',
        timeout: 120000,
        systemInstruction,
        prompt,
        jsonMode: false,
      });
    } else if (process.env.GEMINI_API_KEY?.startsWith('sk-or-v1-')) {
      return await this.callOpenAICompatible({
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'nemotron-3-ultra-550b-a55b:free',
        timeout: 15000,
        systemInstruction,
        prompt,
        jsonMode: false,
      });
    } else if (process.env.GEMINI_API_KEY?.startsWith('csk-')) {
      return await this.callOpenAICompatible({
        baseUrl: 'https://api.cerebras.ai/v1',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'llama3.1-8b',
        timeout: 15000,
        systemInstruction,
        prompt,
        jsonMode: false,
      });
    } else if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
      return await this.callOpenAICompatible({
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'llama-3.1-8b-instant',
        timeout: 15000,
        systemInstruction,
        prompt,
        jsonMode: false,
      });
    } else {
      return await this.callGemini(systemInstruction, prompt, false);
    }
  }

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<AiAnalysis> {
    this.logger.log(`Analyzing image (${mimeType})...`);
    try {
      const systemInstruction = this.buildImageSystemInstruction();
      const prompt = this.buildImagePrompt();

      let cleanText: string;

      if (process.env.LOCAL_LLM_URL) {
        cleanText = await this.callOpenAICompatible({
          baseUrl: process.env.LOCAL_LLM_URL,
          apiKey: process.env.LOCAL_LLM_KEY || '',
          model: process.env.LOCAL_LLM_MODEL || 'llama3.2',
          timeout: 120000,
          systemInstruction,
          prompt,
          jsonMode: true,
          image: { data: imageBuffer, mimeType },
        });
      } else if (process.env.GEMINI_API_KEY?.startsWith('sk-or-v1-')) {
        cleanText = await this.callOpenAICompatible({
          baseUrl: 'https://openrouter.ai/api/v1',
          apiKey: process.env.GEMINI_API_KEY,
          model: 'nemotron-3-ultra-550b-a55b:free',
          timeout: 15000,
          systemInstruction,
          prompt,
          jsonMode: true,
          image: { data: imageBuffer, mimeType },
          visionFallback: {
            model: 'nemotron-3-ultra-550b-a55b:free',
            fallbackPrompt: `${prompt}\n\nNote: The image could not be processed directly. Please generate a generic structured note indicating that an image was uploaded but could not be read. Use category TECH.`,
          },
        });
      } else if (process.env.GEMINI_API_KEY?.startsWith('csk-')) {
        cleanText = await this.callOpenAICompatible({
          baseUrl: 'https://api.cerebras.ai/v1',
          apiKey: process.env.GEMINI_API_KEY,
          model: 'llama3.1-8b',
          timeout: 15000,
          systemInstruction,
          prompt,
          jsonMode: true,
          image: { data: imageBuffer, mimeType },
          visionFallback: {
            model: 'llama3.1-8b',
            fallbackPrompt: `${prompt}\n\nNote: The image could not be processed directly. Please generate a generic structured note indicating that an image was uploaded but could not be read. Use category TECH.`,
          },
        });
      } else if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
        cleanText = await this.callOpenAICompatible({
          baseUrl: 'https://api.groq.com/openai/v1',
          apiKey: process.env.GEMINI_API_KEY,
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          timeout: 15000,
          systemInstruction,
          prompt,
          jsonMode: true,
          image: { data: imageBuffer, mimeType },
          visionFallback: {
            model: 'llama-3.1-8b-instant',
            fallbackPrompt: `${prompt}\n\nNote: The image could not be processed directly. Please generate a generic structured note indicating that an image was uploaded but could not be read. Use category TECH.`,
          },
        });
      } else {
        cleanText = await this.callGemini(
          systemInstruction,
          [
            {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimeType,
              },
            },
            prompt,
          ],
          true,
        );
      }

      return this.parseAiResponse(cleanText);
    } catch (error: any) {
      this.logger.error(`Image analysis failed: ${error.message}`);
      throw error;
    }
  }

  async answerQuestion(query: string, notes: Note[]): Promise<string> {
    this.logger.log('Answering question...');
    try {
      const notesContext = notes
        .map(
          (n, i) =>
            `[Note #${i + 1}] Title: ${n.aiTitle}\nCategory: ${n.category}\nContent:\n${n.content}`,
        )
        .join('\n\n---\n\n');

      const systemInstruction =
        "You are an intelligent Second Brain assistant. Answer the user's question based on the provided notes context. Be concise and professional.";
      const prompt = `I have the following notes stored in my Second Brain:\n\n${notesContext}\n\nBased on these notes, please answer my question: "${query}"`;

      if (process.env.GEMINI_API_KEY?.startsWith('sk-or-v1-')) {
        return await this.callOpenAICompatible({
          baseUrl: 'https://openrouter.ai/api/v1',
          apiKey: process.env.GEMINI_API_KEY,
          model: 'nemotron-3-ultra-550b-a55b:free',
          timeout: 15000,
          systemInstruction,
          prompt,
          jsonMode: false,
        });
      } else if (process.env.GEMINI_API_KEY?.startsWith('csk-')) {
        return await this.callOpenAICompatible({
          baseUrl: 'https://api.cerebras.ai/v1',
          apiKey: process.env.GEMINI_API_KEY,
          model: 'llama3.1-8b',
          timeout: 15000,
          systemInstruction,
          prompt,
          jsonMode: false,
        });
      } else if (process.env.GEMINI_API_KEY?.startsWith('gsk_')) {
        return await this.callOpenAICompatible({
          baseUrl: 'https://api.groq.com/openai/v1',
          apiKey: process.env.GEMINI_API_KEY,
          model: 'llama-3.1-8b-instant',
          timeout: 15000,
          systemInstruction,
          prompt,
          jsonMode: false,
        });
      } else {
        return await this.callGemini(systemInstruction, prompt, false);
      }
    } catch (error: any) {
      this.logger.error(`Question answering failed: ${error.message}`);
      return `Sorry, I encountered an error while trying to answer your question: ${error.message}`;
    }
  }
}

function convertObjectToMarkdown(obj: any, depth = 0): string {
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object' || obj === null) return String(obj);
  if (Array.isArray(obj)) {
    return obj
      .map(
        (item) =>
          `${'  '.repeat(depth)}- ${convertObjectToMarkdown(item, depth + 1)}`,
      )
      .join('\n');
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
