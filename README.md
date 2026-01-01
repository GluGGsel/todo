TODO APP (SELF-HOSTED)
=====================

Was macht die App?
-----------------
Diese App ist eine selbstgehostete, minimalistische To-do-Liste für zwei Personen
(Mann und Frau) mit gemeinsamem Aufgabenpool.

Der Zugriff erfolgt über zwei feste URLs:
- /mann
- /frau

Es gibt keine Benutzerverwaltung und keinen Login.
Die Zuordnung erfolgt ausschließlich über die Oberfläche.

Funktionen:
- To-dos erstellen, anzeigen und abhaken
- Anzeige von Autor (Mann/Frau) und Erstellungsdatum
- Zuweisung pro To-do: Mann / Frau / Beide
- Filter: „Meine“ und „Alle“
- Tags mit Kachel-Filter (7 Stück):
  Haushalt, Wohnung, Fahrzeuge, Finanzen, Termine,
  Gesundheit & Familie, IT & Orga
  + Alle, Untagged
- Mehrere Tags pro To-do möglich
- Optionale Deadline
- Priorität A / B / C (farblich)
- Prioritäts-Empfehlung basierend auf Deadline
- Unterschiedliche Farbwelten (Mann blau, Frau rosa)
- Automatischer Dark Mode
- iOS-Homescreen-fähig
- Lokale SQLite-Datenbank

Kein Cloud-Dienst, kein Tracking.


Systemvoraussetzungen
---------------------
- Linux (Ubuntu LTS empfohlen)
- Root oder sudo
- GitHub-Zugriff
- Node.js 22 LTS
- systemd


Installation (CLI)
------------------

System vorbereiten:
```bash
apt update
apt install git curl build-essential -y
```

Node.js installieren:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install nodejs -y
node -v
npm -v
```

App klonen:
```bash
mkdir -p /opt/todo
cd /opt/todo
git clone https://github.com/<USERNAME>/todo.git .
```

Environment:
```bash
cp .env.example .env
mkdir -p data
```

.env Beispiel:
```text
DATABASE_URL="file:./data/app.db"
```

Dependencies:
```bash
npm ci
```

Prisma:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

Start (dev):
```bash
npm run dev
```

Build + Service:
```bash
npm run build
cp scripts/todo-app.service /etc/systemd/system/todo-app.service
systemctl daemon-reload
systemctl enable --now todo-app
```

Updates:
```bash
cd /opt/todo
git fetch upstream
git merge upstream/main
git push
sudo bash scripts/deploy.sh
```

Icons:
Echte Icons gehören nur ins private Repo:
```text
public/icons/mann/*.png
public/icons/frau/*.png
```

Backup:
```bash
cp /opt/todo/data/app.db /backup/todo_$(date +%F).db
```

Lizenz:
Private Nutzung, keine Gewährleistung.
