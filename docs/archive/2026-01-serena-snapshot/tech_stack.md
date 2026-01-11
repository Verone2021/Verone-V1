# Tech Stack Vérone

## 🏗️ Architecture

- **Monorepo** : Turborepo pour orchestration builds/tests
- **Package Manager** : npm@10.2.4 avec workspaces
- **Node.js** : >=18.0.0 (engine requirement)

## 🎨 Frontend

- **Framework** : Next.js 15.0.3 (App Router, React Server Components)
- **React** : 18.3.1 avec React 18 features
- **UI Library** : shadcn/ui + Radix UI components
- **Styling** : Tailwind CSS + tailwind-merge + tailwindcss-animate
- **Icons** : Lucide React + Radix Icons
- **State Management** : Zustand + React Query (@tanstack/react-query)
- **Forms** : React Hook Form + Zod validation + @hookform/resolvers
- **Tables** : TanStack Table v8

## 🗄️ Backend & Database

- **Database** : Supabase (PostgreSQL + Auth + RLS + Storage)
- **Auth** : Supabase Auth avec helpers Next.js (@supabase/auth-helpers-nextjs)
- **ORM/Client** : @supabase/supabase-js v2.39.8
- **Schema Validation** : Zod v3.22.4 pour business rules

## 🧪 Testing & Quality

- **E2E Testing** : Playwright (@playwright/test)
- **Unit Testing** : Jest + Jest Environment JSDOM
- **Linting** : ESLint + @typescript-eslint + Prettier
- **Type Checking** : TypeScript 5.3.3 (strict mode)
- **Git Hooks** : Husky + lint-staged pour pre-commit

## 🔧 Development Tools

- **Build System** : Turbo (1.12.4) pour monorepo orchestration
- **CSS Processing** : PostCSS + Autoprefixer
- **Date Utilities** : date-fns v3.3.1
- **Class Management** : clsx + class-variance-authority

## 🚀 Deployment & Infrastructure

- **Deployment** : Vercel (inféré depuis package.json structure)
- **Database Hosting** : Supabase Cloud
- **CDN & Storage** : Supabase Storage pour images produits
