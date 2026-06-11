# Integration Plan (Backend & Frontend Contract)

**Goal:** Ensure Backend and Frontend work together seamlessly without conflicts.

---

## Part 1: REST API Contract (HTTP)

### 1.1 Submission (Create Note)
- **Endpoint:** `POST /notes`
- **Request Body (JSON):**
  ```json
  {
    "url": "string (optional, must be valid URL)",
    "userInput": "string (optional, additional notes)"
  }
  ```
- **Constraint:** At least one of `url` or `userInput` must be provided.
- **Success Response:** `202 Accepted`
  ```json
  {
    "id": "uuid-v4-string",
    "status": "PROCESSING"
  }
  ```

### 1.2 Retrieval (List Notes)
- **Endpoint:** `GET /notes`
- **Success Response:** `200 OK` (Array of objects)
- **Object Shape:** See `Note Object` in Part 3.
- **Order:** Descending by `createdAt` (newest first).

---

## Part 2: Real-time Contract (SSE)

### 2.1 Connection
- **Endpoint:** `GET /notes/events`
- **Protocol:** Server-Sent Events (SSE).
- **Headers:** `Content-Type: text/event-stream`, `Cache-Control: no-cache`.

### 2.2 Event: `note-updated`
- **Data (JSON):**
  ```json
  {
    "id": "uuid-v4-string",
    "status": "COMPLETED | FAILED",
    "aiTitle": "string",
    "category": "Enum",
    "aiSummary": "string",
    "aiBullets": ["string", "string"]
  }
  ```
- **Rule:** This event MUST be fired whenever a note transition from `PROCESSING` to `COMPLETED` or `FAILED`.

---

## Part 3: Shared Data Standards (Enums)

### 3.1 Category Enum
Exactly these strings (Case-sensitive):
- `COOKING`, `TECH`, `LEARNING`, `WORK`, `FINANCE`, `OTHER`

### 3.2 Status Enum
Exactly these strings (Case-sensitive):
- `PROCESSING`: Initial state.
- `COMPLETED`: AI processing success.
- `FAILED`: Scrape or AI error.

### 3.3 Note Object Structure
```json
{
  "id": "string",
  "url": "string | null",
  "userInput": "string | null",
  "aiTitle": "string | null",
  "aiSummary": "string | null",
  "aiBullets": ["string"] | null,
  "category": "CategoryEnum",
  "status": "StatusEnum",
  "createdAt": "ISO-8601-string"
}
```

---

## Part 4: Behavioral Protocol (UX Logic)

### 4.1 Frontend Protocol
1. **Optimistic Prepend:** Immediately after receiving the `202` response from `POST /notes`, prepend a skeleton card to the list using the returned `id`.
2. **ID Binding:** Keep a map of `id` -> `CardComponent`. When a `note-updated` SSE event arrives, update the specific card matching that `id`.
3. **Filtering:** Filtering by category must happen client-side to keep the UI snappy.

### 4.2 Backend Protocol
1. **Non-blocking Flow:** Return `202` immediately. Use `setImmediate` or a background worker for AI.
2. **CORS:** Must allow the Frontend origin (typically `http://localhost:3000`).
3. **Validation:** Strip all unknown fields from input (Whitelist).
