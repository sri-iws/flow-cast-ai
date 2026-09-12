# Frontend architecture

The React frontend lives at the repository root:

- `src/App.jsx` owns application state and route-like view switching.
- `src/components/` contains reusable navigation, metric, and product UI pieces.
- `src/pages/` contains the main workspace views.
- `src/api.js` is the boundary for FastAPI requests with a seeded fallback for offline development.
- `styles.css` retains the product visual system and responsive layout.

Run with `npm install` then `npm run dev`.
