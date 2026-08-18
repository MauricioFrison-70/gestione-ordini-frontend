import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, Button, IconButton, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { useFeedback } from "../../../components/useFeedback";
import { criarAgente, listarTiposAgente } from "../../../services/agenteService";
import type { TipoAgente } from "../types/agente";

export default function CriarAgente() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipoAgente, setTipoAgente] = useState<TipoAgente | "">("");
  const [tipos, setTipos] = useState<TipoAgente[]>([]);
  const [archiviato] = useState(false);
  const { mostraMessaggio } = useFeedback();

  useEffect(() => {
    listarTiposAgente()
      .then(setTipos)
      .catch(() => mostraMessaggio("Errore nel caricamento dei tipi di agente", "error"));
  }, [mostraMessaggio]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tipoAgente) return;

    try {
      await criarAgente({ nome, email, tipoAgente, archiviato });
      mostraMessaggio("Agente creato con successo!", "success");
      navigate("/agentes");
    } catch {
      mostraMessaggio("Errore nella creazione dell’agente", "error");
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start", mt: 4 }}>
      <Paper elevation={4} sx={{ width: 420, p: 5, pt: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <IconButton color="primary" onClick={() => navigate("/agentes")} sx={{ mr: 2, "&:hover": { color: "secondary.light" } }}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography variant="h4">Crea nuovo agente</Typography>
        </Box>

        <Box component="form" onSubmit={salvar} sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
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
          <Button type="submit" variant="contained" color="primary" fullWidth>Crea agente</Button>
        </Box>
      </Paper>
    </Box>
  );
}
