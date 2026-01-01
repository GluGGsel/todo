TODO APP

Was ist das?
-----------
Selbstgehostete To-do-App für zwei Personen (Mann / Frau) mit gemeinsamer Aufgabenverwaltung.
Optimiert für Nutzung als PWA auf iOS (Homescreen).

Funktionen:
- Separate URLs: /mann und /frau
- Aufgaben mit Tags, Priorität und Deadline
- Überfällige Aufgaben: Hervorhebung + Zähler
- Aufgaben bearbeiten (Edit)
- Aufgaben anpinnen (Pinned)
- Erledigt-Liste (letzte 20, einklappbar)
- Undo nach Abhaken
- Aktivitäts-Ticker (wer hat was getan)
- Optionale Push-Benachrichtigungen
- Leere Zustände statt leerer Seiten
- Dark Mode (Systemstandard)

Installation (CLI)
------------------
apt update
apt install -y git
cd /opt
git clone https://github.com/Gluggsel/todo.git
cd todo
chmod +x scripts/installer.sh
bash scripts/installer.sh

App aufrufen:
http://SERVER-IP:3000/mann
http://SERVER-IP:3000/frau

Push Notifications (optional)
----------------------------
npx web-push generate-vapid-keys

In .env eintragen:
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@example.com"

Danach neu deployen:
sudo bash scripts/deploy.sh

Wichtige Pfade im Repository
----------------------------
scripts/installer.sh
.env.example   (wird bei Installation nach .env kopiert)
app/           (Next.js App)
components/    (UI-Komponenten)
data/app.db    (SQLite Datenbank)
config/        (nur im privaten Repo, Individualisierung)
