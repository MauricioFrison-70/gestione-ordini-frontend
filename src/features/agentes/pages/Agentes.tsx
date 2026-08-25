import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useFeedback } from "../../../components/useFeedback";
import {
  AgenteUtilizzatoInOrdineError,
  atualizarAgente,
  excluirAgente as excluirAgenteDaApi,
  listarAgentes,
  verificareAgenteUtilizzato,
} from "../../../services/agenteService";
import type { Agente } from "../types/agente";

type ColunaOrdenacao = keyof Pick<Agente, "id" | "nome" | "email" | "tipoAgente" | "archiviato">;

export default function Agentes() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [busca, setBusca] = useState("");
  const [orderBy, setOrderBy] = useState<ColunaOrdenacao>("nome");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [carregando, setCarregando] = useState(true);
  const [agenteParaExcluir, setAgenteParaExcluir] = useState<Agente | null>(null);
  const [agenteParaArquivar, setAgenteParaArquivar] = useState<Agente | null>(null);
  const [agenteInVerifica, setAgenteInVerifica] = useState<number | null>(null);
  const navigate = useNavigate();
  const { mostraMessaggio } = useFeedback();

  useEffect(() => {
    let componenteAtivo = true;

    void listarAgentes()
      .then((data) => {
        if (componenteAtivo) setAgentes(data);
      })
      .catch(() => mostraMessaggio("Errore nel caricamento degli agenti", "error"))
      .finally(() => {
        if (componenteAtivo) setCarregando(false);
      });

    return () => {
      componenteAtivo = false;
    };
  }, [mostraMessaggio]);

  const confirmarExclusao = async () => {
    if (!agenteParaExcluir) return;

    try {
      await excluirAgenteDaApi(agenteParaExcluir.id);
      setAgentes(await listarAgentes());
      mostraMessaggio("Agente eliminato con successo!", "success");
    } catch (errore) {
      if (errore instanceof AgenteUtilizzatoInOrdineError) {
        setAgenteParaArquivar(agenteParaExcluir);
      } else {
        mostraMessaggio("Errore nell’eliminazione dell’agente", "error");
      }
    } finally {
      setAgenteParaExcluir(null);
    }
  };

  const preparareEliminazione = async (agente: Agente) => {
    setAgenteInVerifica(agente.id);
    try {
      if (await verificareAgenteUtilizzato(agente.id)) {
        setAgenteParaArquivar(agente);
      } else {
        setAgenteParaExcluir(agente);
      }
    } catch {
      mostraMessaggio("Errore nella verifica dell’utilizzo dell’agente", "error");
    } finally {
      setAgenteInVerifica(null);
    }
  };

  const arquivarAgente = async () => {
    if (!agenteParaArquivar) return;
    try {
      await atualizarAgente(agenteParaArquivar.id, {
        nome: agenteParaArquivar.nome,
        email: agenteParaArquivar.email,
        tipoAgente: agenteParaArquivar.tipoAgente,
        archiviato: true,
      });
      setAgentes(await listarAgentes());
      mostraMessaggio("Agente archiviato con successo!", "success");
    } catch {
      mostraMessaggio("Errore nell’archiviazione dell’agente", "error");
    } finally {
      setAgenteParaArquivar(null);
    }
  };

  const handleSort = (column: ColunaOrdenacao) => {
    const isAsc = orderBy === column && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(column);
  };

  const sortedAgentes = [...agentes].sort((a, b) => {
    const valueA = a[orderBy].toString().toLowerCase();
    const valueB = b[orderBy].toString().toLowerCase();
    return order === "asc" ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
  });

  const agentesFiltrados = sortedAgentes.filter((agente) =>
    agente.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h1">Elenco agenti</Typography>
        <IconButton color="success" aria-label="Crea agente" onClick={() => navigate("/agentes/criar")}>
          <AddCircleIcon sx={{ fontSize: 40 }} />
        </IconButton>
      </Box>

      <TextField
        label="Cerca per nome"
        variant="outlined"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        sx={{ width: 300, mb: 3 }}
      />

      <TableContainer component={Paper} elevation={4}>
        <Table>
          <TableHead>
            <TableRow>
              {([
                ["id", "ID"],
                ["nome", "Nome"],
                ["email", "Email"],
                ["tipoAgente", "Tipo"],
                ["archiviato", "Attivo"],
              ] as const).map(([coluna, label]) => (
                <TableCell key={coluna}>
                  <TableSortLabel
                    active={orderBy === coluna}
                    direction={orderBy === coluna ? order : "asc"}
                    onClick={() => handleSort(coluna)}
                  >
                    {label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carregando && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress size={28} /></TableCell>
              </TableRow>
            )}
            {!carregando && agentesFiltrados.map((agente) => (
              <TableRow key={agente.id}>
                <TableCell>{agente.id}</TableCell>
                <TableCell>{agente.nome}</TableCell>
                <TableCell>{agente.email}</TableCell>
                <TableCell>{agente.tipoAgente}</TableCell>
                <TableCell>{agente.archiviato ? <CancelIcon color="error" /> : <CheckCircleIcon color="success" />}</TableCell>
                <TableCell>
                  <IconButton color="info" onClick={() => navigate(`/agentes/detalhes/${agente.id}`)} title="Dettagli"><InfoOutlinedIcon /></IconButton>
                  <IconButton color="primary" onClick={() => navigate(`/agentes/editar/${agente.id}`)} title="Modifica"><EditIcon /></IconButton>
                  <IconButton
                    color="error"
                    onClick={() => void preparareEliminazione(agente)}
                    title="Elimina"
                    disabled={agenteInVerifica === agente.id}
                  ><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!carregando && agentesFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>Nessun agente trovato.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={agenteParaExcluir !== null} onClose={() => setAgenteParaExcluir(null)}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vuoi eliminare l&apos;agente {agenteParaExcluir?.nome}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgenteParaExcluir(null)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={confirmarExclusao}>Elimina</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={agenteParaArquivar !== null} onClose={() => setAgenteParaArquivar(null)}>
        <DialogTitle>Agente utilizzato</DialogTitle>
        <DialogContent>
          <DialogContentText>
            L&apos;agente è utilizzato in uno o più ordini. Vuoi archiviarlo o annullare l&apos;eliminazione?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgenteParaArquivar(null)}>Annulla eliminazione</Button>
          <Button color="warning" variant="contained" onClick={arquivarAgente}>Archivia agente</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
