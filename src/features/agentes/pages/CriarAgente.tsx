import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../config/api";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  IconButton,
} from "@mui/material";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function CriarAgente() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipoAgente, setTipoAgente] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);

  // 🔹 Campo invisível, sempre false
  const [archiviato] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/tipo-agente`)
      .then((res) => res.json())
      .then((data) => setTipos(data))
      .catch(() => alert("Erro ao carregar tipos de agente"));
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/agenti`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, tipoAgente, archiviato }), // 🔹 sempre enviado
      });

      if (response.ok) {
        alert("Agente criado com sucesso!");
        navigate("/agentes");
      } else {
        alert("Erro ao criar agente");
      }
    } catch {
      alert("Erro de conexão");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        mt: 4
      }}>
      <Paper elevation={4} sx={{ width: 420, p: 5, pt: 6 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 4
          }}>
          <IconButton
            color="primary"
            onClick={() => navigate("/agentes")}
            sx={{
              mr: 2,
              "&:hover": { color: "secondary.light" },
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>

          <Typography variant="h4">Criar Novo Agente</Typography>
        </Box>

        <Box
          component="form"
          onSubmit={salvar}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            mt: 2
          }}>
          <TextField
            label="Nome"
            variant="outlined"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Email"
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />

          <TextField
            select
            label="Tipo de Agente"
            value={tipoAgente}
            onChange={(e) => setTipoAgente(e.target.value)}
            required
            fullWidth
          >
            <MenuItem value="">Selecione...</MenuItem>
            {tipos.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Criar Agente
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
