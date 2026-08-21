import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useFeedback } from "../../../components/useFeedback";
import {
  AgenteUtilizzatoInOrdineError,
  atualizarAgente,
  buscarAgentePorId,
  excluirAgente,
  verificareAgenteUtilizzato,
} from "../../../services/agenteService";
import type { Agente } from "../types/agente";

export default function ExcluirAgente() {
  const [id, setId] = useState("");
  const [agente, setAgente] = useState<Agente | null>(null);
  const [confermaAperta, setConfermaAperta] = useState(false);
  const [confermaArchiviazioneAperta, setConfermaArchiviazioneAperta] = useState(false);
  const [verificandoUtilizzo, setVerificandoUtilizzo] = useState(false);
  const { mostraMessaggio } = useFeedback();

  const buscarAgente = async () => {
    try {
      setAgente(await buscarAgentePorId(Number(id)));
    } catch {
      mostraMessaggio("Agente non trovato", "error");
      setAgente(null);
    }
  };

  const confirmarExclusao = async () => {
    if (!agente) return;

    try {
      await excluirAgente(agente.id);
      mostraMessaggio("Agente eliminato con successo!", "success");
      setId("");
      setAgente(null);
    } catch (errore) {
      if (errore instanceof AgenteUtilizzatoInOrdineError) {
        setConfermaArchiviazioneAperta(true);
      } else {
        mostraMessaggio("Errore nell'eliminazione dell'agente", "error");
      }
    } finally {
      setConfermaAperta(false);
    }
  };

  const preparareEliminazione = async () => {
    if (!agente) return;
    setVerificandoUtilizzo(true);
    try {
      if (await verificareAgenteUtilizzato(agente.id)) {
        setConfermaArchiviazioneAperta(true);
      } else {
        setConfermaAperta(true);
      }
    } catch {
      mostraMessaggio("Errore nella verifica dell'utilizzo dell'agente", "error");
    } finally {
      setVerificandoUtilizzo(false);
    }
  };

  const archiviareAgente = async () => {
    if (!agente) return;
    try {
      await atualizarAgente(agente.id, {
        nome: agente.nome,
        email: agente.email,
        tipoAgente: agente.tipoAgente,
        archiviato: true,
      });
      mostraMessaggio("Agente archiviato con successo!", "success");
      setId("");
      setAgente(null);
    } catch {
      mostraMessaggio("Errore nell'archiviazione dell'agente", "error");
    } finally {
      setConfermaArchiviazioneAperta(false);
    }
  };

  return (
    <div>
      <h1>Elimina Agente</h1>
      <label>ID dell'agente:</label><br />
      <input type="text" value={id} onChange={(e) => setId(e.target.value)} />
      <br />
      <button onClick={buscarAgente} style={{ marginTop: "10px" }}>Cerca</button>

      {agente && (
        <div style={{ marginTop: "20px" }}>
          <h3>Agente trovato:</h3>
          <p><strong>ID:</strong> {agente.id}</p>
          <p><strong>Nome:</strong> {agente.nome}</p>
          <button
            onClick={() => void preparareEliminazione()}
            disabled={verificandoUtilizzo}
            style={{ marginTop: "10px", backgroundColor: "red", color: "white", padding: "8px 12px", border: "none", cursor: "pointer" }}
          >
            Elimina
          </button>
        </div>
      )}

      <Dialog open={confermaAperta} onClose={() => setConfermaAperta(false)}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vuoi eliminare l&apos;agente {agente?.nome}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfermaAperta(false)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={confirmarExclusao}>Elimina</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confermaArchiviazioneAperta} onClose={() => setConfermaArchiviazioneAperta(false)}>
        <DialogTitle>Agente utilizzato</DialogTitle>
        <DialogContent>
          <DialogContentText>
            L&apos;agente è utilizzato in uno o più ordini di vendita. Vuoi archiviarlo o annullare l&apos;eliminazione?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfermaArchiviazioneAperta(false)}>Annulla eliminazione</Button>
          <Button color="warning" variant="contained" onClick={archiviareAgente}>Archivia agente</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
