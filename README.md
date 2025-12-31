# todo (public)

Self-hosted todo list with two dedicated routes:
- /mann
- /frau

Features:
- Assign to MANN / FRAU / BEIDE
- Filter: "Meine" (= mine + both) and "Alle"
- Tags (7): Haushalt, Wohnung, Fahrzeuge, Finanzen, Termine, Gesundheit & Familie, IT & Orga
- Tag tiles as filters + "Alle" + "Untagged"
- Multiple tags per todo
- Optional deadline
- Priority A/B/C with color badge
- Priority recommendation based on deadline
- Dark mode: system default (prefers-color-scheme)
- iOS homescreen support via per-route manifest and icons

## Local dev
1) Install deps
   npm ci

2) Setup env
   cp .env.example .env

3) Prisma migrate + seed
   npx prisma migrate dev
   npm run seed

4) Run
   npm run dev

Open:
- http://localhost:3000/mann
- http://localhost:3000/frau

## Deployment
Use scripts/deploy.sh, plus systemd unit example scripts/todo-app.service
