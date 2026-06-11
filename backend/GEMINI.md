# GEMINI Backend Rules

## 1. Project Overview
This is the backend component of the Secondary Brain application. It handles business logic, API requests, and real-time Server-Sent Events (SSE).

## 2. Backend Architecture Rules (CRITICAL: MUST FOLLOW)
Whenever Gemini edits or creates code in the backend, you **MUST STRICTLY** adhere to the following principles:

### A. Layered Architecture
- **Controllers**: Responsible ONLY for routing HTTP requests, extracting payloads, and returning responses. Do not put business logic here.
- **Services**: Responsible for all core business logic, database interactions, and integrations (e.g., AI logic).
- **DTOs / Types**: Always strictly validate and type incoming requests and outgoing payloads.

### B. API and Real-Time (SSE)
- Follow the API contracts specified in the project (e.g., `PLAN_INTEGRATION.md`).
- For asynchronous updates (like note processing), emit events via standard SSE implementations.

## 3. General Guidelines
- Handle errors gracefully and always return appropriate HTTP status codes (400 for bad input, 404 for not found, 500 for internal errors).
- Keep functions small and adhere to the Single Responsibility Principle.

## 4. Development Conventions
- **Module/Folder Structure:** Chia các feature/domain ra thành các folder riêng biệt theo chức năng (VD: `notes`, `songs`). Mỗi folder/module bắt buộc phải tách biệt các file `dto`, `repository`, `service`, `controller`.
- **Repositories:** Database logic is abstracted into repository classes (e.g., `SongRepository`). Khuyến khích sử dụng một `BaseRepository` (root repository) cho các query lặp lại nhiều lần.
