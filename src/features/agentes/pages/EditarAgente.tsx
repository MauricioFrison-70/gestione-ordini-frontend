import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { useFeedback } from "../../../components/useFeedback";
import { atualizarAgente, buscarAgentePorId, listarTiposAgente } from "../../../services/agenteService";
import type { TipoAgente } from "../types/agente";

export default function EditarAgente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipoAgente, setTipoAgente] = useState<TipoAgente | "">("");
  const [tipos, setTipos] = useState<TipoAgente[]>([]);
  const [archiviato, setArchiviato] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const { mostraMessaggio } = useFeedback();

  useEffect(() => {
    listarTiposAgente()
      .then(setTipos)
      .catch(() => mostraMessaggio("Errore nel caricamento dei tipi di agente", "error"));
  }, [mostraMessaggio]);

  useEffect(() => {
    if (!id) return;

    void buscarAgentePorId(Number(id))
      .then((agente) => {
        setNome(agente.nome);
        setEmail(agente.email);
        setTipoAgente(agente.tipoAgente);
        setArchiviato(agente.archiviato ?? false);
        setCarregado(true);
      })
      .catch(() => mostraMessaggio("Agente non trovato", "error"));
  }, [id, mostraMessaggio]);

  const salvarAlteracoes = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !tipoAgente) return;

    try {
      await atualizarAgente(Number(id), { nome, email, tipoAgente, archiviato });
      mostraMessaggio("Agente aggiornato con successo!", "success");
      navigate("/agentes");
    } catch {
      mostraMessaggio("Errore nell’aggiornamento dell’agente", "error");
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start", mt: 4 }}>
      <Paper elevation={4} sx={{ width: 420, p: 5, pt: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <IconButton color="primary" onClick={() => navigate("/agentes")} sx={{ mr: 2, "&:hover": { color: "secondary.light" } }}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography variant="h4">Modifica agente</Typography>
        </Box>

        {!carregado && <Typography sx={{ textAlign: "center", mt: 2 }}>Caricamento dati...</Typography>}

        {carregado && (
          <Box component="form" onSubmit={salvarAlteracoes} sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            <TextField label="Nome" variant="outlined" value={nome} onChange={(e) => setNome(e.target.value)} required fullWidth />
            <TextField label="Email" type="email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField
              select
              label="Tipo di agente"
              value={tipoAgente}
              onChange={(e) => setTipoAgente(e.target.value as TipoAgente | "")}
              required
              fullWidth
            >
              <MenuItem value="">Seleziona...</MenuItem>
              {tipos.map((tipo) => <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>)}
            </TextField>
            <FormControlLabel
              control={<Checkbox checked={archiviato} onChange={(e) => setArchiviato(e.target.checked)} />}
              label="Archiviato"
            />
            <Button type="submit" variant="contained" color="primary" fullWidth>Salva modifiche</Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
