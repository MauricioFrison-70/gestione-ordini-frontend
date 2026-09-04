# Dashboard

## Esperienza utente

La pagina iniziale utilizza una griglia con due pannelli superiori, che occupano
circa il 65% dell'altezza disponibile e mostrano grafici derivati dai rapporti.
I due quadranti inferiori sono riuniti in un'unica area di dialogo con
l'assistente Gestione Ordini.

Ogni pannello permette di scegliere:

- un rapporto attivo restituito da `/api/rapporti`;
- i parametri richiesti dal rapporto;
- `Grafico a barre` oppure `Grafico a torta`;
- aggiornamento disattivato, ogni 30 secondi, ogni minuto o ogni 5 minuti.

Il pulsante **Aggiorna grafico** esegue immediatamente il rapporto con i valori
correnti. L'ora dell'ultima risposta completata viene mostrata nel pannello.

## Aggiornamento automatico

L'intervallo predefinito è 60 secondi. Il pannello:

1. esegue il rapporto quando viene caricato e i parametri obbligatori sono
   disponibili;
2. ripete l'esecuzione all'intervallo selezionato;
3. non avvia una seconda richiesta mentre la precedente è in corso;
4. sospende le richieste quando la scheda non è visibile;
5. aggiorna subito il grafico quando la scheda torna visibile.

Questa strategia mantiene i dati recenti senza generare richieste inutili in
background.

## Preferenze locali

Le configurazioni dei due pannelli sono memorizzate in `localStorage` con la
chiave:

```text
gestione-ordini.dashboard.v1
```

Vengono conservati codice del rapporto, tipo di grafico, intervallo e parametri
per rapporto. I dati restano nel profilo corrente del browser e non vengono
inviati a un servizio di sincronizzazione.

Se il contenuto è assente, incompatibile o non valido, vengono applicate le
preferenze predefinite. Se un rapporto salvato non è più disponibile, il
frontend seleziona uno dei rapporti restituiti dall'API.

## Selezione dei dati del grafico

Il frontend individua automaticamente:

- la colonna dei valori: prima una colonna con formato `VALUTA`, poi una colonna
  marcata per la totalizzazione e infine la prima colonna SQL numerica;
- la categoria: la prima colonna non numerica diversa dalla colonna dei valori.

Il grafico rappresenta al massimo le prime 12 righe. Se il risultato è più
grande, l'interfaccia informa che le categorie sono state limitate. Un rapporto
senza una categoria e un valore compatibili rimane eseguibile nella pagina
Rapporti, ma la dashboard mostra che non è adatto a un grafico.

Gli importi `VALUTA` sono formattati in euro con impostazioni locali italiane.
Il grafico a torta utilizza soltanto valori positivi.

## Come rendere un rapporto compatibile

La stored procedure deve restituire almeno:

1. una colonna descrittiva, per esempio `mese` o `venditore`;
2. una colonna numerica, preferibilmente configurata come `VALUTA` quando
   rappresenta denaro.

L'ordine delle righe è controllato dalla stored procedure e determina l'ordine
delle categorie nel grafico. La configurazione dettagliata è nel
[manuale reporting del backend](https://github.com/MauricioFrison-70/gestione-ordini-backend/blob/main/docs/reporting/README.md).

## Manutenzione e test

File principali:

```text
src/features/dashboard/pages/Dashboard.tsx
src/features/dashboard/components/PannelloDashboard.tsx
src/features/dashboard/components/GraficoRapporto.tsx
src/features/dashboard/utils/preferenzeDashboard.ts
src/features/dashboard/pages/Dashboard.test.tsx
```

Quando si modifica la dashboard, verificare almeno:

- caricamento ed esecuzione iniziale;
- salvataggio e ripristino delle preferenze;
- aggiornamento periodico;
- sospensione quando la scheda è nascosta;
- aggiornamento al ritorno della visibilità;
- comportamento con rapporti vuoti o incompatibili.

## Assistente IA

L'area inferiore mostra una conversazione compatta. `Invio` spedisce la domanda
e `Maiusc+Invio` inserisce una nuova riga. Il frontend trasmette al backend la
domanda e al massimo gli ultimi otto messaggi, ma non salva la conversazione nel
browser. Al ricaricamento della pagina il dialogo riparte dal messaggio iniziale.

L'assistente risponde esclusivamente a domande relative al sistema. La chiave
del provider resta nel backend; il browser non invia SQL, nomi di procedure o
credenziali. In questa versione le risposte usano la base statica autorizzata e
non consultano dati commerciali correnti.
