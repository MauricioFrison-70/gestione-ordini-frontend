# Gestione Ordini – Frontend

Frontend sviluppato in **React + TypeScript**, con **Vite** come bundler e **Material UI** come libreria di componenti.  
L’applicazione comunica con il backend Spring Boot tramite API REST.

---

## 🚀 Tecnologie utilizzate

### Frontend
- React 19
- TypeScript 6
- Vite 8
- React Router DOM 7
- Axios 1.18

### UI / Stile
- Material UI (MUI)
- Emotion (styled + react)

### Strumenti di sviluppo
- ESLint 10
- Typescript ESLint
- @vitejs/plugin-react
- Tipi: @types/react, @types/react-dom, @types/node

---

## 📦 Installazione

Assicurati di avere Node.js installato (versione consigliata: 18+).

```bash
npm install
▶️ Avvio in modalità sviluppo
bash
npm run dev
Il server di sviluppo Vite sarà disponibile su:

Código
http://localhost:5173
🏗️ Build per la produzione
bash
npm run build
I file finali verranno generati nella cartella dist/.

🔗 Integrazione con il backend
Il backend del progetto è disponibile qui:

https://github.com/MauricioFrison-70/gestione-ordini-backend

Le chiamate HTTP vengono gestite tramite Axios, nella cartella src/services.

📁 Struttura del progetto
Código
src/
  assets/        # Risorse statiche (immagini, icone, ecc.)
  components/    # Componenti riutilizzabili (es. Menu)
  pages/         # Pagine principali (Dashboard, Agenti, ecc.)
  services/      # Comunicazione con il backend tramite Axios
  config/        # Configurazioni generali
  testes/        # File di test o prova
🧪 Script disponibili
json
"dev": "vite",
"build": "tsc -b && vite build",
"lint": "eslint .",
"preview": "vite preview"
dev: avvia il server di sviluppo

build: compila TypeScript e genera il build di produzione

lint: esegue ESLint

preview: avvia un server di anteprima del build

📜 Licenza
Progetto ad uso personale/studio.