# 🤖 AI API Integration — 2026-06-11

---

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    AiService (NestJS)                    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Routing logic (detect API key)           │    │
│  │                                                  │    │
│  │  GEMINI_API_KEY starts with "gsk_" ?             │    │
│  │          │                    │                  │    │
│  │         YES                   NO                 │    │
│  │          ▼                    ▼                  │    │
│  │   ┌─────────────┐    ┌──────────────────┐       │    │
│  │   │  Groq API   │    │  Google Gemini   │       │    │
│  │   │ (OpenAI-    │    │  Native SDK      │       │    │
│  │   │ compatible) │    │  @google/genai   │       │    │
│  │   └─────────────┘    └──────────────────┘       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Provider 1: Groq API (hiện tại đang dùng)

### Thông tin
- **Base URL:** `https://api.groq.com/openai/v1/chat/completions`
- **API Key format:** `gsk_xxxxxxxxxxxx`
- **Giá:** 🆓 Miễn phí, reset hàng ngày lúc **00:00 UTC (07:00 ICT)**
- **Rate limit:** 14,400 requests/ngày

### Models đang dùng

| Task | Model | Lý do chọn |
|------|-------|-----------|
| Text/Doc analysis | `llama-3.1-8b-instant` | Nhanh, rẻ, JSON mode tốt |
| Image OCR/Vision | `meta-llama/llama-4-scout-17b-16e-instruct` | Model vision duy nhất còn active trên Groq |
| Q&A / Chat | `llama-3.1-8b-instant` | Đủ chất lượng cho RAG |

### Cách gọi API (text)

```typescript
const response = await axios.post(
  'https://api.groq.com/openai/v1/chat/completions',
  {
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },  // Bắt buộc trả JSON
    temperature: 0.2,
  },
  { headers: { 'Authorization': `Bearer ${apiKey}` } }
);
```

### Cách gọi API (vision/ảnh)

```typescript
// Gửi ảnh dạng base64 data URL
const response = await axios.post(
  'https://api.groq.com/openai/v1/chat/completions',
  {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      { role: 'system', content: systemInstruction },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${buffer.toString('base64')}`
            }
          }
        ]
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  }
);
```

### Fallback strategy

```
Vision request
  └─► meta-llama/llama-4-scout-17b-16e-instruct
        ├─ ✅ OK → trả về phân tích đầy đủ
        └─ ❌ Lỗi → WARN log + fallback
              └─► llama-3.1-8b-instant (text only)
                    └─ Tạo note với thông báo ảnh không đọc được
```

### Models có sẵn trên Groq (tính đến 2026-06-11)
```
allam-2-7b
qwen/qwen3-32b
llama-3.3-70b-versatile
llama-3.1-8b-instant                         ← dùng cho text
meta-llama/llama-4-scout-17b-16e-instruct    ← dùng cho vision
groq/compound-mini
groq/compound
whisper-large-v3-turbo
openai/gpt-oss-120b
whisper-large-v3
```

---

## Provider 2: Google Gemini (fallback)

### Thông tin
- **SDK:** `@google/genai` (Google Gen AI SDK)
- **API Key format:** `AIzaSy...`
- **Free tier:** 15 req/phút, 1500 req/ngày (Gemini 2.0 Flash)
- **Lấy key:** [Google AI Studio](https://aistudio.google.com/)

### Khởi tạo SDK

```typescript
this.ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
  httpOptions: process.env.GEMINI_API_BASE_URL
    ? { baseUrl: process.env.GEMINI_API_BASE_URL }  // Cho phép dùng proxy
    : undefined,
});
```

### Gọi text analysis

```typescript
const response = await this.ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: prompt,
  config: {
    systemInstruction: '...',
    responseMimeType: 'application/json',
    responseSchema: zodToJsonSchema(AiAnalysisSchema),
  },
});
const text = response.text;
```

### Gọi image analysis (multimodal)

```typescript
const response = await this.ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: [
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType,
      },
    },
    textPrompt,
  ],
});
```

---

## Provider 3: OpenRouter (proxy, đã dùng trước đây)

### Thông tin
- **Base URL:** `http://localhost:8081/v1` (qua `gemini-web2api` local proxy)
- **API Key format:** `sk-or-v1-...`
- **Cấu hình `.env`:**
  ```env
  GEMINI_API_KEY="sk-or-v1-xxxx"
  GEMINI_API_BASE_URL=http://localhost:8081
  ```

### Vấn đề gặp phải với OpenRouter
1. Key hết hạn/hết credit → `invalid token`
2. Proxy local (`gemini-web2api`) bị shutdown Docker → mất kết nối
3. Model không nhận `responseSchema` → Zod validation fail
4. Trả về JSON bọc trong markdown backticks → parse error

---

## Cấu trúc dữ liệu AI: `AiAnalysisSchema`

```typescript
export const AiAnalysisSchema = z.object({
  title: z.string(),                  // Tiêu đề tự động
  summary: z.string(),               // Tóm tắt 2-3 câu
  bullets: z.array(z.string()),      // Key points
  category: z.nativeEnum(Category), // COOKING/TECH/LEARNING/WORK/FINANCE/OTHER
  content: z.string().optional(),    // Nội dung Markdown đầy đủ (cho ảnh)
});
```

---

## Xử lý lỗi & Defensive parsing

### Strip markdown code block

```typescript
let cleanText = responseText.trim();
if (cleanText.startsWith('```')) {
  cleanText = cleanText.replace(/^```(?:json)?\n?/i, '')
                        .replace(/\n?```$/, '')
                        .trim();
}
```

### Zod validation với error logging

```typescript
const analysis = JSON.parse(cleanText);
try {
  return AiAnalysisSchema.parse(analysis);
} catch (validationError) {
  this.logger.error(`Validation failed. Raw JSON: ${cleanText}`);
  throw validationError;
}
```

---

## Cách đổi provider

### Chuyển sang Groq (khuyên dùng — miễn phí)
```env
# backend/.env
GEMINI_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxx"
# Xóa hoặc comment dòng GEMINI_API_BASE_URL
```

### Chuyển sang Google Gemini
```env
GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxx"
# Xóa hoặc comment dòng GEMINI_API_BASE_URL
```

### Chuyển sang OpenRouter qua proxy local
```env
GEMINI_API_KEY="sk-or-v1-xxxxxxxxxxxx"
GEMINI_API_BASE_URL=http://localhost:8081
# Đảm bảo gemini-web2api proxy đang chạy
```

> ⚠️ **Quan trọng:** Sau khi đổi key trong `.env`, phải **restart server** để Node.js load biến môi trường mới. `nest start --watch` chỉ reload code TypeScript, không reload `.env`.
