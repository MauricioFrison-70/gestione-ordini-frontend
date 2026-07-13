import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./components/Menu";
import { Box, Toolbar } from "@mui/material";

import Agentes from "./pages/Agentes";
import CriarAgente from "./pages/CriarAgente";
import EditarAgente from "./pages/EditarAgente";
import ExcluirAgente from "./pages/ExcluirAgente";
import Dashboard from "./pages/Dashboard";

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
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;
