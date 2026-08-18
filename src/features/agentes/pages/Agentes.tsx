import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  TableSortLabel,
  Box,
  Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { Agente } from "../types/agente";

type ColunaOrdenacao = keyof Pick<Agente, "id" | "nome" | "email" | "tipoAgente" | "archiviato">;
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"; // 🔹 Ícone Dettagli

async function buscarAgentes(): Promise<Agente[]> {
  const response = await fetch("http://localhost:8081/api/agenti");

  if (!response.ok) {
    throw new Error("Erro ao carregar agentes");
  }

  return response.json() as Promise<Agente[]>;
}

export default function Agentes() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [busca, setBusca] = useState("");

  const [orderBy, setOrderBy] = useState<ColunaOrdenacao>("nome");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const navigate = useNavigate();

  useEffect(() => {
    let componenteAtivo = true;

    void buscarAgentes()
      .then((data) => {
        if (componenteAtivo) {
          setAgentes(data);
        }
      })
      .catch(() => alert("Erro ao carregar agentes"));

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const excluirAgente = async (id: number) => {
    if (!confirm("Deseja realmente excluir este agente?")) return;

    try {
      const response = await fetch(`http://localhost:8081/api/agenti/${id}`, {
        method: "DELETE",
      });

      if (response.ok) setAgentes(await buscarAgentes());
    } catch {
      alert("Erro ao excluir agente");
    }
  };

  const handleSort = (column: ColunaOrdenacao) => {
    const isAsc = orderBy === column && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(column);
  };

  const sortedAgentes = [...agentes].sort((a, b) => {
    const valueA = a[orderBy]?.toString().toLowerCase();
    const valueB = b[orderBy]?.toString().toLowerCase();
    return order === "asc" ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
  });

  const agentesFiltrados = sortedAgentes.filter((agente) =>
    agente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3
        }}>
        <Typography variant="h1">Lista de Agentes</Typography>

        <IconButton color="success" onClick={() => navigate("/agentes/criar")}>
          <AddCircleIcon sx={{ fontSize: 40 }} />
        </IconButton>
      </Box>

      <TextField
        label="Buscar por nome"
        variant="outlined"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        sx={{ width: 300, mb: 3 }}
      />

      <TableContainer component={Paper} elevation={4}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "id"}
                  direction={orderBy === "id" ? order : "asc"}
                  onClick={() => handleSort("id")}
                >
                  ID
                </TableSortLabel>
              </TableCell>

              <TableCell>
                <TableSortLabel
                  active={orderBy === "nome"}
                  direction={orderBy === "nome" ? order : "asc"}
                  onClick={() => handleSort("nome")}
                >
                  Nome
                </TableSortLabel>
              </TableCell>

              <TableCell>
                <TableSortLabel
                  active={orderBy === "email"}
                  direction={orderBy === "email" ? order : "asc"}
                  onClick={() => handleSort("email")}
                >
                  Email
                </TableSortLabel>
              </TableCell>

              <TableCell>
                <TableSortLabel
                  active={orderBy === "tipoAgente"}
                  direction={orderBy === "tipoAgente" ? order : "asc"}
                  onClick={() => handleSort("tipoAgente")}
                >
                  Tipo
                </TableSortLabel>
              </TableCell>

              <TableCell>
                <TableSortLabel
                  active={orderBy === "archiviato"}
                  direction={orderBy === "archiviato" ? order : "asc"}
                  onClick={() => handleSort("archiviato")}
                >
                  Attivo
                </TableSortLabel>
              </TableCell>

              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {agentesFiltrados.map((agente) => (
              <TableRow key={agente.id}>
                <TableCell>{agente.id}</TableCell>
                <TableCell>{agente.nome}</TableCell>
                <TableCell>{agente.email}</TableCell>
                <TableCell>{agente.tipoAgente}</TableCell>

                <TableCell>
                  {agente.archiviato ? (
                    <CancelIcon color="error" />
                  ) : (
                    <CheckCircleIcon color="success" />
                  )}
                </TableCell>

                <TableCell>
                  {/* 🔹 Botão Dettagli */}
                  <IconButton
                    color="info"
                    onClick={() => navigate(`/agentes/detalhes/${agente.id}`)}
                    title="Dettagli"
                  >
                    <InfoOutlinedIcon />
                  </IconButton>

                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/agentes/editar/${agente.id}`)}
                    title="Modifica"
                  >
                    <EditIcon />
                  </IconButton>

                  <IconButton
                    color="error"
                    onClick={() => excluirAgente(agente.id)}
                    title="Elimina"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {agentesFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Nenhum agente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
