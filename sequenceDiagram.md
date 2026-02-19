# InterviewIQ — Sequence Diagrams

---

## 1. Google Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Firebase
    participant AuthController
    participant AuthService
    participant UserRepository
    participant TokenService

    User->>Frontend: Click Sign In with Google
    Frontend->>Firebase: Trigger Google OAuth popup
    Firebase-->>Frontend: Return Google ID token
    Frontend->>AuthController: POST /api/auth/google (idToken)
    AuthController->>AuthService: googleAuth(idToken)
    AuthService->>Firebase: Verify ID token
    Firebase-->>AuthService: Return user profile (name, email)
    AuthService->>UserRepository: findByEmail(email)
    UserRepository-->>AuthService: User or null
    AuthService->>UserRepository: createUser(name, email) if not found
    UserRepository-->>AuthService: New user with 100 credits
    AuthService->>TokenService: sign(userId)
    TokenService-->>AuthService: JWT token
    AuthService-->>AuthController: Return user + token
    AuthController-->>Frontend: Set HTTP-only cookie + return user
    Frontend-->>User: Redirect to dashboard
```

---

## 2. Resume Upload and Analysis Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant InterviewController
    participant ResumeAnalyzerService
    participant AIProvider

    User->>Frontend: Upload PDF resume
    Frontend->>InterviewController: POST /api/interview/resume (file)
    InterviewController->>ResumeAnalyzerService: analyze(filepath)
    ResumeAnalyzerService->>ResumeAnalyzerService: extractPdfText(filepath)
    ResumeAnalyzerService->>AIProvider: complete(resumePrompt)
    AIProvider-->>ResumeAnalyzerService: Extracted role, skills, experience, projects
    ResumeAnalyzerService-->>InterviewController: ResumeAnalysisResult
    InterviewController-->>Frontend: Return parsed resume data
    Frontend-->>User: Auto-fill role and experience fields
```

---

## 3. Interview Question Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant InterviewController
    participant InterviewService
    participant CreditService
    participant UserRepository
    participant InterviewStrategyFactory
    participant AIProvider
    participant InterviewRepository

    User->>Frontend: Click Start Interview
    Frontend->>InterviewController: POST /api/interview/generate-questions
    InterviewController->>InterviewService: createInterview(userId, dto)
    InterviewService->>CreditService: debit(userId, 50)
    CreditService->>UserRepository: decrementCreditsIfEnough(userId, 50)
    UserRepository-->>CreditService: Updated user or error
    CreditService-->>InterviewService: Credits deducted
    InterviewService->>InterviewStrategyFactory: for(mode)
    InterviewStrategyFactory-->>InterviewService: Strategy instance
    InterviewService->>AIProvider: complete(questionPrompt)
    AIProvider-->>InterviewService: Raw question list
    InterviewService->>InterviewService: parseQuestions(raw)
    InterviewService->>InterviewRepository: createInterview(data)
    InterviewRepository-->>InterviewService: Saved interview document
    InterviewService-->>InterviewController: Interview with questions
    InterviewController-->>Frontend: Return interview + questions
    Frontend-->>User: Begin live interview session
```

---

## 4. Answer Submission and Evaluation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant InterviewController
    participant SubmitAnswerCommand
    participant AnswerEvaluationService
    participant InterviewStrategyFactory
    participant AIProvider
    participant InterviewRepository

    User->>Frontend: Submit answer (voice or text)
    Frontend->>InterviewController: POST /api/interview/submit-answer
    InterviewController->>SubmitAnswerCommand: new SubmitAnswerCommand(evaluator, dto)
    InterviewController->>SubmitAnswerCommand: execute()
    SubmitAnswerCommand->>AnswerEvaluationService: evaluate(dto)
    AnswerEvaluationService->>InterviewRepository: findById(interviewId)
    InterviewRepository-->>AnswerEvaluationService: Interview document
    AnswerEvaluationService->>AnswerEvaluationService: Check if answer is expired
    AnswerEvaluationService->>InterviewStrategyFactory: for(mode)
    InterviewStrategyFactory-->>AnswerEvaluationService: Strategy instance
    AnswerEvaluationService->>AIProvider: complete(scoringPrompt)
    AIProvider-->>AnswerEvaluationService: Score, confidence, communication, feedback
    AnswerEvaluationService->>InterviewRepository: updateById (apply score to question)
    InterviewRepository-->>AnswerEvaluationService: Updated document
    AnswerEvaluationService-->>SubmitAnswerCommand: feedback string
    SubmitAnswerCommand-->>InterviewController: feedback
    InterviewController-->>Frontend: Return feedback
    Frontend-->>User: Show AI feedback in real time
```

---

## 5. Finish Interview and Report Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant InterviewController
    participant FinishInterviewCommand
    participant InterviewService
    participant InterviewRepository
    participant InterviewAggregate
    participant EventBus

    User->>Frontend: Click Finish Interview
    Frontend->>InterviewController: POST /api/interview/finish
    InterviewController->>FinishInterviewCommand: new FinishInterviewCommand(service, id)
    InterviewController->>FinishInterviewCommand: execute()
    FinishInterviewCommand->>InterviewService: finishInterview(interviewId)
    InterviewService->>InterviewRepository: findById(interviewId)
    InterviewRepository-->>InterviewService: Interview with all answered questions
    InterviewService->>InterviewAggregate: new InterviewAggregate(questions)
    InterviewAggregate->>InterviewAggregate: averageScores()
    InterviewAggregate-->>InterviewService: Final score and averages
    InterviewService->>InterviewRepository: updateById (finalScore, status completed)
    InterviewRepository-->>InterviewService: Updated interview
    InterviewService->>EventBus: emit(InterviewCompleted, payload)
    InterviewService-->>FinishInterviewCommand: FinishInterviewResult
    FinishInterviewCommand-->>InterviewController: Result
    InterviewController-->>Frontend: Return final score and report
    Frontend-->>User: Show performance report with charts
```

---

## 6. Payment and Credit Top-Up Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant PaymentController
    participant PaymentService
    participant PaymentGateway
    participant PaymentRepository
    participant CreditService
    participant UserRepository

    User->>Frontend: Select credit plan and click Pay
    Frontend->>PaymentController: POST /api/payment/order
    PaymentController->>PaymentService: createOrder(userId, dto)
    PaymentService->>PaymentGateway: createOrder(amount, currency)
    PaymentGateway-->>PaymentService: Razorpay order (orderId, amount)
    PaymentService->>PaymentRepository: createPayment(userId, orderId, status created)
    PaymentRepository-->>PaymentService: Saved payment record
    PaymentService-->>PaymentController: Return order details
    PaymentController-->>Frontend: Return orderId and key
    Frontend->>User: Open Razorpay payment modal
    User->>Frontend: Complete payment
    Frontend->>PaymentController: POST /api/payment/verify (paymentId, signature)
    PaymentController->>PaymentService: verifyPayment(dto)
    PaymentService->>PaymentGateway: verifySignature(orderId, paymentId, signature)
    PaymentGateway-->>PaymentService: Valid or invalid
    PaymentService->>PaymentRepository: updateById (status paid, razorpayPaymentId)
    PaymentService->>CreditService: grant(userId, credits)
    CreditService->>UserRepository: incrementCredits(userId, credits)
    UserRepository-->>CreditService: Updated user credits
    PaymentService-->>PaymentController: Verification result
    PaymentController-->>Frontend: Credits added confirmation
    Frontend-->>User: Show updated credit balance
```
