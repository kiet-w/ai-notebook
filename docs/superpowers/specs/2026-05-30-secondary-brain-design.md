# Secondary Brain Design Specification

**Date:** 2026-05-30
**Topic:** AI-Powered Secondary Brain (Notion Style)
**Status:** Approved

## 1. Overview
A web-based "Secondary Brain" for capturing, classifying, and summarizing content (URLs or text) using AI. The system automates the organization process, requiring zero manual formatting from the user.

## 2. Core Features
- **Smart Capture:** Single input field for URLs or text + optional notes.
- **AI Classification:** Automatic assignment to fixed categories (COOKING, TECH, LEARNING, WORK, FINANCE, OTHER).
- **AI Extraction:** Automatic generation of a summary and key bullet points.
- **Notion-Style UI:** Sidebar for navigation (Categories/Tags) and a Main Feed for content.
- **Real-time Updates:** Asynchronous AI processing with live UI updates via SSE.

## 3. Technical Architecture
- **Backend:** NestJS, Prisma, **Supabase (PostgreSQL Hosting)**, Axios (Scraping), OpenAI/Gemini API.
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Lucide Icons.
- **Integration:** 
    - REST API for data submission and retrieval.
    - SSE (Server-Sent Events) for real-time updates.


## 4. Data Models (Prisma)
```prisma
enum Category {
  COOKING
  TECH
  LEARNING
  WORK
  FINANCE
  OTHER
}

enum Status {
  PROCESSING
  COMPLETED
  FAILED
}

model Note {
  id          String   @id @default(uuid())
  url         String?
  userInput   String?  // Optional user notes
  aiTitle     String?
  aiSummary   String?
  aiBullets   Json?    // Array of strings
  category    Category @default(OTHER)
  status      Status   @default(PROCESSING)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 5. AI Prompt Strategy (JSON Schema)
The Backend must enforce the following JSON response from the AI:
```json
{
  "title": "Clear and concise title",
  "category": "ONE_OF_THE_ENUMS",
  "summary": "2-3 sentence summary",
  "bullets": ["Point 1", "Point 2", "Point 3"]
}
```

## 6. UI/UX Flow
1. **Sidebar:** Navigation links for "Dashboard" and each Category.
2. **Input Bar:** Top-level sticky input for quick saving.
3. **Feed:** List of cards. 
    - `PROCESSING` state: Shimmer/Skeleton effect.
    - `COMPLETED` state: Full content with category-specific icons.
    - `FAILED` state: Option to retry or view raw content.
