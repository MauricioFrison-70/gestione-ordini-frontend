import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./components/Menu";
import { FeedbackProvider } from "./components/FeedbackProvider";
import { Box, Toolbar } from "@mui/material";

import Agentes from "./features/agentes/pages/Agentes";
import CriarAgente from "./features/agentes/pages/CriarAgente";
import EditarAgente from "./features/agentes/pages/EditarAgente";
import ExcluirAgente from "./features/agentes/pages/ExcluirAgente";
import Dashboard from "./features/dashboard/pages/Dashboard";
import DettagliAgente from "./features/agentes/pages/DettagliAgente";
import Prodotti from "./features/prodotti/pages/Prodotti";
import CreareProdotto from "./features/prodotti/pages/CreareProdotto";
import ModificareProdotto from "./features/prodotti/pages/ModificareProdotto";
import DettagliProdotto from "./features/prodotti/pages/DettagliProdotto";
import EliminareProdotto from "./features/prodotti/pages/EliminareProdotto";
import OrdiniVendita from "./features/ordiniVendita/pages/OrdiniVendita";
import CreareOrdineVendita from "./features/ordiniVendita/pages/CreareOrdineVendita";
import DettagliOrdineVendita from "./features/ordiniVendita/pages/DettagliOrdineVendita";
import ModificareOrdineVendita from "./features/ordiniVendita/pages/ModificareOrdineVendita";
import RigheOrdineVendita from "./features/ordiniVendita/pages/RigheOrdineVendita";
import OrdiniAcquisto from "./features/ordiniAcquisto/pages/OrdiniAcquisto";
import CreareOrdineAcquisto from "./features/ordiniAcquisto/pages/CreareOrdineAcquisto";
import RigheOrdineAcquisto from "./features/ordiniAcquisto/pages/RigheOrdineAcquisto";
import Rapporti from "./features/rapporti/pages/Rapporti";

function App() {
  return (
    <FeedbackProvider>
      <BrowserRouter>
        <Box sx={{ display: "flex" }}>
        <Menu />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
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
            <Route path="/prodotti" element={<Prodotti />} />
            <Route path="/prodotti/creare" element={<CreareProdotto />} />
            <Route path="/prodotti/modificare/:id" element={<ModificareProdotto />} />
            <Route path="/prodotti/dettagli/:id" element={<DettagliProdotto />} />
            <Route path="/prodotti/eliminare" element={<EliminareProdotto />} />
            <Route path="/ordini-vendita" element={<OrdiniVendita />} />
            <Route path="/ordini-vendita/creare" element={<CreareOrdineVendita />} />
            <Route path="/ordini-vendita/dettagli/:id" element={<DettagliOrdineVendita />} />
            <Route path="/ordini-vendita/modificare/:id" element={<ModificareOrdineVendita />} />
            <Route path="/ordini-vendita/:ordineId/righe" element={<RigheOrdineVendita />} />
            <Route path="/ordini-acquisto" element={<OrdiniAcquisto />} />
            <Route path="/ordini-acquisto/creare" element={<CreareOrdineAcquisto />} />
            <Route path="/ordini-acquisto/:ordineId/righe" element={<RigheOrdineAcquisto />} />
            <Route path="/rapporti" element={<Rapporti />} />
        
          </Routes>
        </Box>
        </Box>
      </BrowserRouter>
    </FeedbackProvider>
  );
}

export default App;
