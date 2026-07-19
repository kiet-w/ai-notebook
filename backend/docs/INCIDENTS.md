# Bug Fixes & Security Updates

## 1. Logic Error: Incorrect Exception Thrown on Invalid Login Email
**Severity:** Medium
**Symptom:** When attempting to log in with an email that did not exist in the database, the UI displayed `"Email is already registered"`.
**Root Cause:** 
In `UserService.login`, the code incorrectly threw `CheckEmailException` when `!user` was true. `CheckEmailException` was designed for the Registration flow and hardcoded the message `"Email is already registered"`.
**Resolution:** 
Changed the logic to throw `VerifyPasswordException` (which carries the message `"Invalid credentials"`) when the user email is not found. This not only fixes the misleading UI error but also aligns with security best practices by preventing email enumeration attacks. Updated `user.service.spec.ts` to reflect the correct exception expectation.

## 2. Security: Missing Refresh Token Revocation on Logout
**Severity:** Critical
**Symptom:** The `/users/logout` API only cleared the HTTP-only cookie on the client side, but failed to mark the Refresh Token as revoked in the database.
**Risk:** If an attacker intercepted the Refresh Token before the user logged out, they could continue to request new Access Tokens indefinitely.
**Resolution:** 
Updated `user.controller.ts` to extract the `refreshToken` from the incoming request cookies and explicitly call `this.userService.logout(refreshToken)`. The token is now flagged as `isRevoked: true` in the Prisma database during logout.

## 3. Security: Memory Exhaustion (DoS) Vulnerability on File Upload
**Severity:** Critical
**Symptom:** The `/notes/upload` API used NestJS's default `FileInterceptor` without any size limits or file type restrictions.
**Risk:** Malicious users could upload massive files or unsupported formats, causing Node.js to read the entire file into RAM (`file.buffer`). This would trigger an Out of Memory (OOM) error, instantly crashing the server.
**Resolution:** 
Added a `ParseFilePipeBuilder` to the `@UploadedFile()` decorator in `notes.controller.ts`. It strictly limits uploads to 5MB (`maxSize: 5 * 1024 * 1024`) and enforces safe MIME types (`/(pdf|png|jpeg|jpg|md)$/i`). Invalid requests are now rejected with a `422 Unprocessable Entity` status before reading into RAM.

## 4. Infrastructure: Server Crash & Fake CORS Error due to Hoisting
**Severity:** High
**Symptom:** Browser reported a CORS error (`Reason: CORS request did not succeed`) on frontend requests, even though CORS was properly configured.
**Root Cause:** 
The backend server failed to boot up and crashed immediately. In `main.ts`, the `import { AppModule }` statement was hoisted by the JS engine to execute *before* `dotenv.config()`. As a result, when `UserModule` initialized and synchronously checked for `process.env.JWT_SECRET`, the environment variable was undefined, throwing an error and killing the Node process. The dead server caused the browser to misinterpret the "Connection Refused" as a CORS block.
**Resolution:** 
Refactored `UserModule` to use `JwtModule.registerAsync()` instead of `JwtModule.register()`. This defers the injection and validation of the `JWT_SECRET` until runtime (after `dotenv` has successfully loaded the `.env` file). Also appended `JWT_SECRET` to the local `.env` file.
