# InterviewIQ — AI-Powered Mock Interview Platform

## 1. Project Overview

InterviewIQ is a full-stack MERN application designed to help job candidates practice and prepare for interviews using AI-powered simulations, real-time evaluation, and detailed performance feedback.

The system enables users to configure an interview session, answer AI-generated questions through speech or text, and receive structured scoring across confidence, communication, and correctness — all within a guided three-step workflow.

The primary focus of this project is clean backend architecture, AI integration, strategy-based interview mode design, and a monetized credit system with real payment processing.

---

## 2. Problem Statement

Job seekers struggle with interview preparation due to:

- No access to realistic, on-demand mock interview environments
- Generic practice questions not tailored to their role or experience
- No structured, objective feedback after practice sessions
- Difficulty identifying weak areas (communication vs. technical knowledge)
- Expensive coaching services with limited availability
- No way to track performance trends over time

Existing tools are either too simple (static question banks) or too expensive (human coaches).

InterviewIQ solves this by offering a personalized, AI-evaluated interview experience that adapts to the user's role, experience level, resume, and preferred interview mode.

---

## 3. Target Users

### Job Seeker / Candidate
- Practice mock interviews in Technical, HR, or Behavioral modes
- Upload resume for personalized question generation
- Review performance reports and track improvement
- Purchase credit packs for additional sessions

### Student / Fresh Graduate
- Gain exposure to real interview formats
- Receive actionable feedback on soft skills and technical answers
- Practice at their own pace without time pressure

### Career Switcher
- Prepare for roles in a new domain
- Focus on behavioral and HR rounds specific to mid-career transitions

---

## 4. Core Features

### 4.1 Authentication & Authorization
- Google OAuth 2.0 via Firebase for seamless sign-in
- JWT-based session management with secure HTTP-only cookies
- Automatic user creation on first sign-in
- Protected API routes with auth middleware

### 4.2 Interview Setup (Step 1)
- Select target role, experience level, and interview mode
- Optionally upload a PDF resume for AI-powered customization
- AI extracts role, skills, projects, and experience from the resume
- Interview configuration is validated before question generation

### 4.3 Multi-Mode Interview Engine (Step 2)
Three distinct interview modes, each with a different evaluation focus:

| Mode | Focus | Scoring Weights |
|------|-------|-----------------|
| Technical | Correctness-heavy | Correctness: 60%, Communication: 20%, Confidence: 20% |
| HR | Balanced | Equal weight across all three dimensions |
| Behavioral | Soft skills | Communication: 50%, Confidence: 30%, Correctness: 20% |

Each session:
- Generates AI questions with progressive difficulty (easy → medium → hard)
- Delivers questions via AI voice (male/female avatar selection)
- Accepts answers via speech-to-text (Web Speech API) or typed input
- Enforces configurable per-question time limits (60–120 seconds)
- Evaluates each answer in real-time using the OpenRouter AI API

### 4.4 Performance Report (Step 3)
- Overall score and per-dimension breakdown (confidence, communication, correctness)
- Question-level feedback with individual scores
- Performance trend charts (Recharts)
- Circular progress indicators for visual clarity
- PDF report export via jsPDF

### 4.5 Credit System
- New users receive 100 free credits
- Each interview session costs 50 credits
- Credits are refunded on AI processing failures (atomic rollback)
- Tiered credit plans: Free (100), Starter (150), Pro (650)

### 4.6 Payment Integration
- Razorpay payment gateway for credit purchases
- Server-side HMAC signature verification for payment authenticity
- Atomic credit top-up after verified payment
- Full payment history stored per user

### 4.7 Interview History & Analytics
- View all past interview sessions with status and scores
- Open detailed reports for any completed session
- Track improvement over time

---

## 5. Backend Architecture

### 5.1 Layered Architecture
```
HTTP Request
    ↓
Router → Controller → Service → Repository → MongoDB
                  ↓
           AI Provider / Payment Gateway
```

- **Controllers**: Handle HTTP, validate input via Zod DTOs, delegate to services
- **Services**: Contain business logic, orchestrate operations
- **Repositories**: Encapsulate all MongoDB queries via Mongoose
- **Providers**: Adapter interfaces for OpenRouter AI and Razorpay

### 5.2 Design Patterns Used

| Pattern | Usage |
|---------|-------|
| Strategy Pattern | Interview mode evaluation (Technical / HR / Behavioral) |
| Factory Pattern | `InterviewStrategyFactory` selects strategy by mode |
| Template Method | `BaseInterviewStrategy` defines question parsing and scoring flow |
| Repository Pattern | Decoupled data access with interface contracts |
| Command Pattern | `SubmitAnswerCommand`, `FinishInterviewCommand` |
| Observer Pattern | Domain event bus for post-interview side effects |
| Adapter Pattern | `OpenRouterProvider`, `RazorpayGateway` wrap external APIs |
| Specification Pattern | Reusable query specifications in `InterviewSpecs.ts` |
| Unit of Work | Atomic multi-collection operations |

### 5.3 SOLID Principles
- **S** — Each service has a single responsibility (CreditService, AnswerEvaluationService, ResumeAnalyzerService)
- **O** — New interview modes can be added without modifying existing strategies
- **L** — All strategy implementations are substitutable via `IInterviewStrategy`
- **I** — Focused interfaces for AI, payment, and repository layers
- **D** — All dependencies injected via composition root (`composition-root.ts`)

---

## 6. AI Integration

### Resume Analysis
- PDF text extracted using `pdfjs-dist`
- Prompt instructs AI to extract: role, years of experience, listed skills, project names
- Returns structured JSON used to pre-fill interview setup

### Question Generation
- Prompt includes role, experience level, interview mode, and resume context
- AI returns a list of difficulty-tagged questions in structured format
- Questions are stored in the interview document before the session begins

### Answer Evaluation
- Each submitted answer is evaluated against the question and context
- AI returns: score (0–100), confidence rating, communication rating, correctness rating, and written feedback
- Time limit violations are handled gracefully (penalized score, no AI call)
- Evaluation failures trigger an automatic credit refund

---

## 7. Database Design

### Collections

**Users**
```
{ name, email, credits, createdAt, updatedAt }
```

**Interviews**
```
{
  userId, role, experience, mode, resumeText,
  questions: [{
    question, difficulty, timeLimit,
    answer, feedback, score,
    confidence, communication, correctness
  }],
  finalScore, status, createdAt, updatedAt
}
```

**Payments**
```
{
  userId, planId, amount, credits,
  razorpayOrderId, razorpayPaymentId,
  status, createdAt, updatedAt
}
```

Indexes are applied on `userId` across all collections for query performance.

---

## 8. Frontend Architecture

### Interview Flow (Multi-Step)
```
Step 1: Setup → Step 2: Live Interview → Step 3: Report
```

- **Step1SetUp**: Role, experience, mode selection, resume upload
- **Step2Interview**: AI avatar, speech recognition, timer, real-time transcript
- **Step3Report**: Score breakdown, per-question feedback, PDF download

### State Management
- Redux Toolkit stores authenticated user state globally
- React Router handles client-side navigation
- Axios with base URL handles all API communication

### UI Libraries
- Tailwind CSS for utility-first responsive styling
- Framer Motion (via `motion`) for animated transitions
- Recharts for performance trend visualization
- React Circular Progressbar for score display

---

## 9. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, TypeScript, Express 5 |
| Database | MongoDB with Mongoose ODM |
| Auth | Google OAuth 2.0 (Firebase) + JWT |
| AI | OpenRouter API (GPT-4o-mini) |
| Payments | Razorpay |
| File Handling | Multer + pdfjs-dist |
| Validation | Zod |
| Testing | Vitest, Supertest, MongoDB Memory Server |

---

## 10. Scope of Milestone-1

For this milestone:

- Finalize system scope and interview flow design
- Design Use Case Diagram
- Design Sequence Diagram (interview lifecycle)
- Design Class Diagram (strategy hierarchy, service layer)
- Design Architecture Diagram (layered + provider model)
- Design ER Diagram (Users, Interviews, Payments)

Implementation begins after architectural modeling is reviewed and approved.

---

## 11. Expected Outcome

By completing this project, the system demonstrates:

- Full-stack engineering with TypeScript and React
- AI integration for dynamic content generation and evaluation
- Real payment processing with Razorpay
- Clean architecture following SOLID principles
- Multiple design patterns applied in a production-like context
- Credit-based monetization with atomic transaction handling
- Speech-to-text driven UX for a natural interview experience
- Scalable, testable, and maintainable codebase
