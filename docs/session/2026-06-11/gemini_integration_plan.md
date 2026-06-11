# Plan: Connecting Gemini API to Analyze and Extract Key Points

This plan outlines the steps to replace the mocked AI logic in the backend `AiService` with real calls to the Google Gemini API (`gemini-2.0-flash`), enabling automatic summarization, structured data extraction, and natural language questioning on your Second Brain notes.

---

## 1. Objectives
- Replace fake timeouts and hardcoded responses in `AiService`.
- Use the official `@google/genai` SDK to send parsed Markdown content to Gemini.
- Leverage JSON schema constraints via Zod (`zod-to-json-schema`) to guarantee structured outputs (Title, Summary, Bullets, Category).
- Implement real semantic querying across notes in the `answerQuestion` method.

---

## 2. Implementation Steps

### Step 1: Update `AiService.analyze`
Modify the `analyze` method in `backend/src/notes/ai.service.ts`:
- Define a system instruction or prompt:
  ```
  You are an expert knowledge assistant. Analyze the provided document context and extract:
  1. A concise title representing the document.
  2. A brief, high-level summary.
  3. A list of key bullet points highlighting important insights.
  4. The most appropriate category (COOKING, TECH, LEARNING, WORK, FINANCE, OTHER).
  ```
- Make the API call using `this.ai.models.generateContent`:
  ```typescript
  const response = await this.ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Analyze this content:\n\n${content}`,
    config: {
      systemInstruction: 'You are a knowledge parsing assistant for a Second Brain app.',
      responseMimeType: 'application/json',
      responseSchema: zodToJsonSchema(AiAnalysisSchema),
    },
  });
  ```
- Parse and validate the response:
  ```typescript
  const analysis = JSON.parse(response.text);
  return AiAnalysisSchema.parse(analysis);
  ```

### Step 2: Update `AiService.answerQuestion`
Modify the `answerQuestion` method to provide real answers using note contexts:
- Format the historical notes into the prompt so Gemini can search them:
  ```typescript
  const notesContext = notes
    .map(n => `[Note ID: ${n.id}] Title: ${n.aiTitle}\nContent:\n${n.content}`)
    .join('\n\n---\n\n');
  ```
- Call Gemini:
  ```typescript
  const response = await this.ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Based on my Second Brain notes:\n\n${notesContext}\n\nAnswer this question: ${query}`,
  });
  return response.text || 'No answer generated.';
  ```

### Step 3: Local Verification & Tests
- Ensure `GEMINI_API_KEY` is loaded from `backend/.env`.
- Run unit tests (`bun run test`) and adjust mocks where necessary.
