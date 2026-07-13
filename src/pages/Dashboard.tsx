import { Box, Grid, Paper, Typography, IconButton } from "@mui/material";

import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4 }}>
      {/* Titolo */}
      <Typography variant="h3" sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      {/* Griglia dei Cards */}
      <Grid container spacing={3}>
        
        {/* Card: Lista Agenti */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={4}
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              cursor: "pointer",
              transition: "0.2s",
              "&:hover": { transform: "scale(1.02)" },
            }}
            onClick={() => navigate("/agentes")}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <PeopleAltIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="h5">Agenti</Typography>
            </Box>

            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              Gestisci tutti gli agenti registrati nel sistema.
            </Typography>

            <Box display="flex" justifyContent="flex-end">
              <ArrowForwardIosIcon sx={{ opacity: 0.6 }} />
            </Box>
          </Paper>
        </Grid>

        {/* Card: Crea Nuovo Agente */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={4}
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              cursor: "pointer",
              transition: "0.2s",
              "&:hover": { transform: "scale(1.02)" },
            }}
            onClick={() => navigate("/agentes/criar")}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <AddCircleIcon color="success" sx={{ fontSize: 40 }} />
              <Typography variant="h5">Nuovo Agente</Typography>
            </Box>

            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              Aggiungi rapidamente un nuovo agente al sistema.
            </Typography>

            <Box display="flex" justifyContent="flex-end">
              <ArrowForwardIosIcon sx={{ opacity: 0.6 }} />
            </Box>
          </Paper>
        </Grid>

        {/* Card: Report e Statistiche */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={4}
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              cursor: "pointer",
              transition: "0.2s",
              "&:hover": { transform: "scale(1.02)" },
            }}
            onClick={() => navigate("/relatorios")}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <AssessmentIcon color="secondary" sx={{ fontSize: 40 }} />
              <Typography variant="h5">Report</Typography>
            </Box>

            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              Visualizza metriche, grafici e statistiche del sistema.
            </Typography>

            <Box display="flex" justifyContent="flex-end">
              <ArrowForwardIosIcon sx={{ opacity: 0.6 }} />
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}
