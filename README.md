TODO APP (SELF-HOSTED)
=====================

Was macht die App?
-----------------
Eine selbstgehostete To-do-App für zwei Personen (Mann / Frau) mit gemeinsamem Aufgabenpool.

- Zugriff über feste URLs: /mann und /frau
- Keine Benutzerkonten, kein Login
- To-dos erstellen und abhaken
- Autor + Datum sichtbar
- Zuweisung: Mann / Frau / Beide
- Filter: Meine / Alle
- Tags (7 Kategorien) + Untagged
- Optionale Deadline mit Prioritäts-Empfehlung (A/B/C)
- Unterschiedliche Farbwelten (Mann blau, Frau rosa)
- Automatischer Dark Mode
- Lokale SQLite-Datenbank
- iOS-Homescreen-fähig

Kein Cloud-Zwang, kein Tracking.


Installation (CLI)
------------------

System vorbereiten:
```bash
apt update
apt install git curl build-essential -y
```

Node.js 22 LTS installieren:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install nodejs -y
```

App klonen:
```bash
mkdir -p /opt/todo
cd /opt/todo
git clone https://github.com/<USERNAME>/todo.git .
```

Environment vorbereiten:
```bash
cp .env.example .env
mkdir -p data
```

Dependencies + Build:
```bash
npm ci
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run build
```

Service starten:
```bash
cp scripts/todo-app.service /etc/systemd/system/todo-app.service
systemctl daemon-reload
systemctl enable --now todo-app
```

App läuft auf Port 3000:
- http://<SERVER-IP>:3000/mann
- http://<SERVER-IP>:3000/frau
