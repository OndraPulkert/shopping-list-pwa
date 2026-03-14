# Shopping List PWA

## Project overview
This project is a responsive Progressive Web App for managing a shopping list on desktop and mobile.

## Product goals
- Extremely fast adding of shopping items
- Very simple item completion while in a store
- Good mobile UX with large touch targets
- Fast MVP with simple persistence backed by SQLite/Turso
- PWA installable on mobile and desktop
- Clean, minimal UI

## Technical constraints
- Use Next.js App Router
- Use TypeScript
- Use Tailwind CSS
- Prefer simple client-side state over unnecessary abstraction
- Avoid unnecessary dependencies
- Keep components small and composable
- Prefer accessibility and keyboard support

## UX rules
- Primary action must be obvious on mobile
- Clicking an item toggles bought state
- Bought items should visually move to the bottom
- Keep bought items visible but visually muted
- Empty state should be friendly and actionable

## Coding rules
- Use strict TypeScript-friendly code
- Keep logic in small utility functions/hooks
- Avoid overengineering
- Prefer explicit names over clever abstractions
- Keep business logic testable
- Keep the existing SQLite/Turso-backed architecture unless explicitly requested otherwise

## Agent orchestration
- Use planner for breaking down larger tasks
- Use frontend-implementer for React/Next.js UI work
- Use pwa-mobile-qa for installability, manifest, service worker, and mobile UX validation
- Use reviewer after meaningful changes
