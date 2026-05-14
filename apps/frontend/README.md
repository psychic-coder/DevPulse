DevPulse Next.js frontend (TypeScript + Tailwind + Framer Motion)

This is a minimal Next.js + TypeScript frontend configured with Tailwind CSS and Framer Motion.

Quick start:

```bash
# from the workspace root
cd apps/frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:3000` and talks to the backend at `http://localhost:3001`.

Notes:

- The app uses client-side fetch to `GET /posts` and `GET /posts/:id/comments`.
- Tailwind and Framer Motion are preconfigured.
