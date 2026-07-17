import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./components/Menu";
import { Box, Toolbar } from "@mui/material";

import Agentes from "./features/agentes/pages/Agentes";
import CriarAgente from "./features/agentes/pages/CriarAgente";
import EditarAgente from "./features/agentes/pages/EditarAgente";
import ExcluirAgente from "./features/agentes/pages/ExcluirAgente";
import Dashboard from "./features/agentes/pages/Dashboard";
import DettagliAgente from "./features/agentes/pages/DettagliAgente";

const drawerWidth = 240;

function App() {
  return (
    <BrowserRouter>
      <Box sx={{ display: "flex" }}>
        <Menu />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            ml: `${drawerWidth}px`,
            backgroundColor: "background.default",
            minHeight: "100vh",
          }}
        >
          <Toolbar />

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agentes" element={<Agentes />} />
            <Route path="/agentes/criar" element={<CriarAgente />} />
            <Route path="/agentes/editar/:id" element={<EditarAgente />} />
            <Route path="/agentes/excluir" element={<ExcluirAgente />} />    
            <Route path="/agentes/detalhes/:id" element={<DettagliAgente />} />
        
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;
