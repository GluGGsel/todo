TODO APP (SELF-HOSTED)
=====================

Was macht die App?
-----------------
Diese App ist eine selbstgehostete, minimalistische To-do-Liste für zwei Personen
(Mann und Frau) mit gemeinsamem Aufgabenpool.

Zugriff erfolgt über zwei feste URLs:
- /mann
- /frau

Es gibt keine Benutzerverwaltung und keinen Login.
Die Zuordnung erfolgt rein über die Oberfläche.

Funktionen:
- To-dos erstellen, abhaken und anzeigen
- Autor (Mann/Frau) + Erstellungsdatum wird angezeigt
- Zuweisung pro To-do: Mann / Frau / Beide
- Filter:
  - „Meine“ (mir zugewiesen + beide)
  - „Alle“
- Tags (7 Stück) mit Kachel-Filter:
  - Haushalt
  - Wohnung
  - Fahrzeuge
  - Finanzen
  - Termine
  - Gesundheit & Familie
  - IT & Orga
  + Sonderfilter:
    - Alle
    - Untagged
- Mehrere Tags pro To-do möglich
- Optionale Deadline
- Priorität A / B / C (farblich)
  - A = ≤ 2 Tage
  - B = ≤ 7 Tage
  - C = ≤ 30 Tage
- Empfehlung der Priorität basierend auf gesetzter Deadline
- Unterschiedliche Farbwelten:
  - Mann = Blau
  - Frau = Rosa
- Dark Mode automatisch über System (`prefers-color-scheme`)
- iOS-Homescreen-fähig (separate Icons pro Route)
- Datenhaltung lokal über SQLite (eine Datei)

Kein Cloud-Dienst, kein Tracking, keine externen Abhängigkeiten.


Systemvoraussetzungen
---------------------
- Linux (getestet mit Ubuntu LTS)
- Root-Zugriff oder sudo
- Internetzugang
- GitHub-Zugriff (public + optional private Repo)
- Node.js 22 LTS
- systemd

Empfohlen:
- Proxmox LXC oder VM


Installation (CLI)
------------------

1) System vorbereiten
---------------------
apt update
apt install git curl build-essential -y

2) Node.js 22 LTS installieren
------------------------------
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install nodejs -y
node -v
npm -v

3) App klonen
-------------
mkdir -p /opt/todo
cd /opt/todo
git clone https://github.com/<USERNAME>/todo.git .

(Optional: private Downstream-Repo verwenden)
git remote add upstream https://github.com/<USERNAME>/todo.git

4) Environment vorbereiten
--------------------------
cp .env.example .env
mkdir -p data

Inhalt .env (Beispiel):
DATABASE_URL="file:./data/app.db"

5) Abhängigkeiten installieren
-------------------------------
npm ci

6) Prisma initialisieren
------------------------
npx prisma generate

Falls noch keine Migration existiert:
npx prisma migrate dev --name init

Danach:
npm run seed

7) App testen (Development)
---------------------------
npm run dev

Aufrufen:
- http://<SERVER-IP>:3000/mann
- http://<SERVER-IP>:3000/frau

8) Production Build
-------------------
npm run build

9) systemd Service installieren
-------------------------------
cp scripts/todo-app.service /etc/systemd/system/todo-app.service
systemctl daemon-reload
systemctl enable --now todo-app
systemctl status todo-app --no-pager

Die App läuft nun dauerhaft auf Port 3000.


Updates / Deployment
--------------------
Standard-Workflow:

cd /opt/todo
git fetch upstream
git merge upstream/main
git push
sudo bash scripts/deploy.sh


Icons (wichtig)
---------------
Im Public Repository befinden sich nur Platzhalter für Icons.
Echte Icons gehören ausschließlich ins private Repository.


Backup
------
Alle Daten liegen in:
 /opt/todo/data/app.db

Empfohlenes Backup:
cp /opt/todo/data/app.db /backup/todo_$(date +%F).db


Lizenz / Nutzung
----------------
Private Nutzung, Self-Hosting.
Keine Gewährleistung.
