# Gestione Ordini — Frontend

Applicazione web in italiano per gestire agenti, prodotti, ordini, rapporti e
indicatori grafici. È sviluppata con React e TypeScript e comunica con il
backend Spring Boot tramite API REST.

## Funzionalità

- dashboard con due pannelli configurabili;
- grafici a barre e a torta generati dai rapporti dinamici;
- aggiornamento manuale o automatico della dashboard;
- memorizzazione locale dell'ultima configurazione dei grafici;
- assistente IA nella parte inferiore della dashboard, limitato alle domande
  sul sistema Gestione Ordini;
- gestione completa degli agenti e archiviazione dei record già utilizzati;
- gestione dei prodotti con giacenza di sola lettura;
- ordini di vendita con testata, righe, filtri, rilascio e annullamento;
- ordini di acquisto con testata, righe, filtri, ricevimento e annullamento;
- rapporti dinamici con parametri definiti dal database;
- esportazione dei risultati in Excel e PDF;
- notifiche e dialoghi di conferma coerenti tramite Material UI.

Le regole sensibili, come la disponibilità di magazzino o la possibilità di
modificare ed eliminare un ordine, vengono sempre validate anche dal backend.

## Tecnologie

- React 19 e TypeScript 6
- Vite 8
- Material UI 9 ed Emotion
- React Router DOM 7
- Fetch API nativa
- jsPDF e jsPDF-AutoTable per PDF
- write-excel-file per Excel
- Vitest e Testing Library
- Playwright per i test end-to-end

## Prerequisiti

- Node.js `20.19+` oppure `22.12+`;
- npm;
- backend disponibile per l'utilizzo dell'applicazione e per i test E2E.

## Installazione e avvio

Installare le dipendenze:

```bash
npm install
```

Creare `.env` a partire da `.env.example` e indicare l'URL pubblico dell'API:

```env
VITE_API_URL=http://localhost:8081/api
```

Avviare l'applicazione:

```bash
npm run dev
```

Vite utilizza normalmente `http://localhost:5173`.

> Le variabili con prefisso `VITE_` vengono incluse nel codice inviato al
> browser. Non inserirvi password, token, chiavi API o altri segreti.

## Immagine Docker del frontend

Il `Dockerfile` usa un build multi-stage: Node.js viene utilizzato soltanto per
compilare l'applicazione, mentre l'immagine finale usa Nginx non privilegiato
per pubblicare i file statici. Le rotte React dispongono del fallback verso
`index.html` e il container espone un health check dedicato.

Costruzione dell'immagine con il backend locale sulla porta predefinita:

```powershell
docker build -t gestione-ordini-frontend:local .
```

La URL della API viene incorporata nei file statici durante il build. Per
utilizzare un indirizzo diverso:

```powershell
docker build --build-arg VITE_API_URL="https://api.example.com/api" `
  -t gestione-ordini-frontend:local .
```

Esecuzione locale:

```powershell
docker run --rm -p 5173:8080 gestione-ordini-frontend:local
```

Aprire `http://localhost:5173`. Il backend deve essere raggiungibile dalla
macchina dell'utente all'indirizzo configurato durante il build; nessuna
credenziale deve essere inserita in variabili con prefisso `VITE_`.

Per avviare frontend, backend, SQL Server e dati dimostrativi insieme, usare
`avvia-docker.ps1` nel repository adiacente `gestione-ordini-backend`. Lo
script riconosce anche il nome locale `gestioneOrdiniBackend`.

## Pubblicazione dell'immagine

Il workflow `.github/workflows/pubblica-immagine.yml` valida ogni pull request
verso `main` con lint, test Vitest, build di produzione e test end-to-end
Playwright su Chromium. Dopo il merge, tutte le verifiche vengono ripetute su
`main`; soltanto se terminano correttamente viene pubblicata l'immagine Linux
AMD64 nel GitHub Container Registry:

```text
ghcr.io/mauriciofrison-70/gestione-ordini-frontend:latest
```

Sono pubblicati anche un tag associato al commit (`sha-*`) e, per i tag Git
`v*`, i corrispondenti tag di versione. Il pacchetto pronto per l'utente finale,
con Compose e avvio automatico per Windows, viene prodotto dal repository del
backend tramite GitHub Releases.

## Script disponibili

| Comando | Descrizione |
| --- | --- |
| `npm run dev` | Avvia il server di sviluppo. |
| `npm run build` | Controlla TypeScript e genera il bundle in `dist/`. |
| `npm run lint` | Analizza il codice con ESLint. |
| `npm test` | Esegue una volta i test Vitest. |
| `npm run test:watch` | Esegue Vitest in modalità interattiva. |
| `npm run test:e2e` | Esegue i test Playwright. |
| `npm run preview` | Mostra localmente il bundle di produzione. |

Per installare il browser necessario a Playwright, se non è già presente:

```bash
npx playwright install chromium
```

## Moduli

### Dashboard

I due pannelli superiori possono usare qualsiasi rapporto compatibile con un
grafico. Per ogni pannello l'utente sceglie rapporto, parametri, tipo di grafico
e intervallo di aggiornamento. Le preferenze vengono conservate nel browser.

La parte inferiore riunisce i due quadranti in un'unica conversazione con
l'assistente. Il browser non riceve la chiave del provider e non conserva la
conversazione nel `localStorage`.

Il comportamento completo è descritto in
[docs/dashboard.md](docs/dashboard.md).

### Agenti

Gestisce agenti di tipo cliente, venditore, trasportatore e fornitore. Prima
dell'eliminazione viene verificato l'utilizzo negli ordini. Un agente utilizzato
può essere archiviato per conservarne lo storico.

### Prodotti e giacenza

Il codice del prodotto non è modificabile. La quantità è di sola lettura e
viene aggiornata soltanto dal ricevimento degli ordini di acquisto e dal rilascio
degli ordini di vendita.

### Ordini di vendita

Dopo la creazione della testata si apre direttamente la gestione delle righe.
Gli ordini possono essere filtrati per stato. Le operazioni su testata e righe
sono disponibili finché l'ordine è pendente; rilascio e annullamento concludono
il flusso.

### Ordini di acquisto

Dopo la creazione della testata si gestiscono le righe prodotto. Il ricevimento
della merce aggiorna la giacenza; l'annullamento conclude l'ordine senza
movimentare il magazzino.

### Rapporti

La pagina costruisce automaticamente filtri e colonne dai metadati restituiti
dal backend. I formati supportati includono valuta, data e data/ora. Le colonne
configurate possono produrre una riga di totale. Il risultato può essere
esportato in Excel o PDF.

## Struttura

```text
src/
├── components/              menu e feedback globale
├── config/                  configurazione dell'API
├── features/
│   ├── dashboard/           pannelli, grafici e preferenze
│   ├── assistente/          dialogo IA dedicato al sistema
│   ├── agentes/             anagrafica degli agenti
│   ├── prodotti/            prodotti e giacenza
│   ├── ordiniVendita/       testate e righe di vendita
│   ├── ordiniAcquisto/      testate e righe di acquisto
│   └── rapporti/            esecuzione ed esportazione dei rapporti
├── services/                client HTTP per le API
├── test/                    configurazione condivisa di Vitest
├── App.tsx                  rotte dell'applicazione
└── theme.ts                 tema Material UI
e2e/                         scenari Playwright
http/                        richieste HTTP manuali
docs/                        documentazione funzionale del frontend
```

## Integrazione con il backend

Risorse principali utilizzate:

- `/api/agenti` e `/api/tipo-agente`;
- `/api/prodotti`;
- `/api/ordini-vendita` e relative `/righe`;
- `/api/ordini-acquisto` e relative `/righe`;
- `/api/rapporti`;
- `/api/assistente/domande`.

Repository correlato:
[gestione-ordini-backend](https://github.com/MauricioFrison-70/gestione-ordini-backend).

La documentazione funzionale utilizzata anche dall'assistente IA è
disponibile nella
[base di conoscenza del backend](https://github.com/MauricioFrison-70/gestione-ordini-backend/blob/main/docs/ai/base-conoscenza-sistema.md).

## Qualità prima di una pull request

Eseguire:

```bash
npm run lint
npm test
npm run build
```

Quando il flusso completo è interessato e il backend è disponibile, eseguire
anche:

```bash
npm run test:e2e
```

Una modifica funzionale deve aggiornare anche il README, il documento specifico
del modulo e la base di conoscenza condivisa, quando pertinente.
