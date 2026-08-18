import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import { useFeedback } from "../../../components/useFeedback";
import { buscarAgentePorId } from "../../../services/agenteService";
import type { Agente } from "../types/agente";

export default function DettagliAgente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agente, setAgente] = useState<Agente | null>(null);
  const { mostraMessaggio } = useFeedback();

  useEffect(() => {
    if (!id) return;

    buscarAgentePorId(Number(id))
      .then(setAgente)
      .catch(() => mostraMessaggio("Errore nel caricamento dei dettagli dell’agente", "error"));
  }, [id, mostraMessaggio]);

  if (!agente) {
    return <Typography variant="h5" sx={{ mt: 4, textAlign: "center" }}>Caricamento dettagli...</Typography>;
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
      <Paper elevation={4} sx={{ width: 480, p: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Dettagli dell’Agente</Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="body1" sx={{ mb: 1 }}><strong>ID:</strong> {agente.id}</Typography>
        <Typography variant="body1" sx={{ mb: 1 }}><strong>Nome:</strong> {agente.nome}</Typography>
        <Typography variant="body1" sx={{ mb: 1 }}><strong>Email:</strong> {agente.email}</Typography>
        <Typography variant="body1" sx={{ mb: 1 }}><strong>Tipo:</strong> {agente.tipoAgente}</Typography>
        <Typography variant="body1" sx={{ mb: 1 }}><strong>Attivo:</strong> {agente.archiviato ? "No" : "Sì"}</Typography>
        <Typography variant="body1" sx={{ mb: 1 }}><strong>Archiviato:</strong> {agente.archiviato ? "Sì" : "No"}</Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Registrato il:</strong> {new Date(agente.dataRegistrazione).toLocaleString("it-IT")}
        </Typography>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button variant="outlined" color="primary" onClick={() => navigate("/agentes")}>Indietro</Button>
          <Button variant="contained" color="secondary" onClick={() => navigate(`/agentes/editar/${agente.id}`)}>Modifica</Button>
        </Box>
      </Paper>
    </Box>
  );
}
