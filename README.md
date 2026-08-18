# Gestione Ordini — Frontend

Frontend per la gestione di agenti e prodotti. È sviluppato con React, TypeScript e Vite e comunica con il backend Spring Boot tramite API REST.

L'interfaccia utente è in italiano. Le notifiche e le conferme di eliminazione usano i componenti di Material UI.

## Tecnologie

- React 19 e TypeScript 6
- Vite 8
- Material UI (MUI) 9 e Emotion
- React Router DOM 7
- Fetch API nativa del browser
- Vitest e Testing Library per i test unitari
- Playwright per i test end-to-end

## Prerequisiti

- Node.js `20.19+` oppure `22.12+`
- Backend in esecuzione per usare l'applicazione e i test E2E

## Installazione e avvio

Installa le dipendenze:

```bash
npm install
```

Crea il file `.env` a partire dal modello `.env.example` e configura l'URL del backend:

```env
VITE_API_URL=http://localhost:8081/api
```

Avvia l'applicazione in modalità di sviluppo:

```bash
npm run dev
```

Vite espone normalmente l'applicazione su `http://localhost:5173`.

> Le variabili che iniziano con `VITE_` sono incluse nel bundle del browser. Non inserire password, token o altri segreti in queste variabili.

## Script disponibili

| Comando | Descrizione |
| --- | --- |
| `npm run dev` | Avvia il server di sviluppo. |
| `npm run build` | Esegue il controllo TypeScript e genera il bundle in `dist/`. |
| `npm run lint` | Analizza il codice con ESLint. |
| `npm test` | Esegue i test unitari con Vitest. |
| `npm run test:watch` | Esegue Vitest in modalità interattiva. |
| `npm run test:e2e` | Esegue i test end-to-end con Playwright. |
| `npm run preview` | Avvia un'anteprima locale del bundle di produzione. |

Per i test E2E, il backend deve essere raggiungibile all'URL configurato in `VITE_API_URL` e il browser Playwright deve essere installato.

## Funzionalità attuali

- Gestione degli agenti: elenco, ricerca, creazione, modifica, dettagli ed eliminazione.
- Gestione dei prodotti: elenco, ricerca, creazione, modifica, dettagli ed eliminazione.
- Codice prodotto immutabile dopo la creazione, in conformità con il contratto del backend.
- Notifiche globali e dialoghi di conferma basati su MUI.

## Struttura del progetto

```text
src/
├── components/              # Menu e feedback globale
├── config/                  # Configurazione dell'API
├── features/
│   ├── agentes/             # Modulo agenti e relativi test
│   └── prodotti/            # Modulo prodotti e relativi test
├── services/                # Client HTTP per agenti e prodotti
├── test/                    # Configurazione condivisa di Vitest
├── App.tsx                  # Rotte dell'applicazione
└── theme.ts                 # Tema Material UI
e2e/                         # Test Playwright
http/                        # Richieste HTTP manuali
```

## Integrazione con il backend

Il frontend utilizza i seguenti endpoint principali:

- `/api/agenti`
- `/api/tipo-agente`
- `/api/prodotti`

Il repository del backend è disponibile su [gestione-ordini-backend](https://github.com/MauricioFrison-70/gestione-ordini-backend).

## Qualità del codice

Prima di aprire una pull request, esegui almeno:

```bash
npm run lint
npm test
npm run build
```
