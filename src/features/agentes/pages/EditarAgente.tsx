import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../../../config/api";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function EditarAgente() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipoAgente, setTipoAgente] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);
  const [archiviato, setArchiviato] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/tipo-agente`)
      .then((res) => res.json())
      .then((data) => setTipos(data))
      .catch(() => alert("Erro ao carregar tipos de agente"));
  }, []);

  useEffect(() => {
    const carregarAgente = async () => {
      try {
        const response = await fetch(`${API_URL}/agenti/${id}`);

        if (response.ok) {
          const data = await response.json();
          setNome(data.nome);
          setEmail(data.email);
          setTipoAgente(data.tipoAgente);
          setArchiviato(data.archiviato ?? false);
          setCarregado(true);
        } else {
          alert("Agente não encontrado");
        }
      } catch {
        alert("Erro de conexão");
      }
    };

    carregarAgente();
  }, [id]);

  const salvarAlteracoes = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/agenti/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, tipoAgente, archiviato }),
      });

      if (response.ok) {
        alert("Agente atualizado com sucesso!");
        navigate("/agentes");
      } else {
        alert("Erro ao atualizar agente");
      }
    } catch {
      alert("Erro de conexão");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" mt={4}>
      <Paper elevation={4} sx={{ width: 420, p: 5, pt: 6 }}>
        <Box display="flex" alignItems="center" mb={4}>
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

          <Typography variant="h4">Editar Agente</Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          {!carregado && (
            <Typography textAlign="center" mt={2}>
              Carregando dados...
            </Typography>
          )}

          {carregado && (
            <Box
              component="form"
              onSubmit={salvarAlteracoes}
              display="flex"
              flexDirection="column"
              gap={3}
            >
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

              {/* NOVO CAMPO: ARCHIVIATO */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={archiviato}
                    onChange={(e) => setArchiviato(e.target.checked)}
                  />
                }
                label="Archiviato"
              />

              <Button type="submit" variant="contained" color="primary" fullWidth>
                Salvar Modificações
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
