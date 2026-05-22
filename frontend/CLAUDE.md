# Frontend Development Guide

## Project Name
AI Exam Copilot Frontend

## Stack
- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand
- React Query
- Framer Motion

---

# Coding Standards

## TypeScript

Rules:
- strict typing required
- avoid any
- use reusable interfaces
- use proper generics

---

# Folder Structure

## Architecture
Feature-based frontend architecture.

Folders:
- app/
- components/
- features/
- hooks/
- services/
- store/
- providers/

---

# Component Rules

## Components must:
- be reusable
- be modular
- avoid business logic
- remain UI-focused

Business logic belongs in:
- hooks/
- features/
- services/

---

# Naming Conventions

## React Components
Use PascalCase.

Examples:
- ChatWindow.tsx
- QuizCard.tsx

## Hooks
Use camelCase.

Examples:
- useChat.ts
- useQuiz.ts

## Route Folders
Use kebab-case.

Examples:
- forgot-password/
- study-planner/

---

# State Management

## Zustand

Use Zustand stores for:
- auth
- chat
- quiz
- planner
- uploads

Avoid large prop drilling.

---

# API Standards

## React Query

Use React Query for:
- server state
- caching
- API synchronization

Never fetch data directly inside components.

Use:
services/api/

---

# Styling Rules

## TailwindCSS

Prefer:
- utility-first styling
- reusable class patterns
- responsive layouts

Avoid:
- inline styles
- large custom CSS files

---

# UI Design Rules

## Theme
Dark mode first.

## Style
Modern AI SaaS interface.

Use:
- rounded corners
- glass cards
- soft shadows
- subtle gradients

---

# Animation Rules

Use:
- Framer Motion

Animations should:
- improve UX
- feel lightweight
- not block interactions

---

# AI Chat Rules

## Chat UI must support:
- markdown rendering
- streaming text
- syntax highlighting
- citation rendering
- loading states

---

# Forms

Use:
- React Hook Form
- Zod validation

All forms must:
- validate inputs
- show proper errors
- support loading states

---

# Performance Rules

Optimize:
- re-renders
- bundle size
- API calls

Use:
- dynamic imports
- memoization
- Suspense
- lazy loading

---

# Error Handling

All pages should support:
- loading states
- empty states
- error states

---

# Accessibility

Ensure:
- semantic HTML
- keyboard navigation
- aria labels where needed

---

# Preferred Libraries

## UI
- shadcn/ui
- lucide-react

## State
- Zustand

## Data Fetching
- React Query

## Animations
- Framer Motion

## Charts
- Recharts

---

# Important Frontend Principle

This is not a simple student dashboard.

The UI should feel like:
- an AI operating system
- a premium EdTech platform
- a production-grade SaaS application

Prioritize:
- clarity
- usability
- responsiveness
- AI-first interactions