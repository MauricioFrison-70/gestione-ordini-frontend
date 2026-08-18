import { Drawer, List, ListItemButton, ListItemText, Toolbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

const drawerWidth = 240;

export default function Menu() {
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "background.paper",
          color: "text.primary",
        },
      }}
    >
      <Toolbar />
      <List>
        <ListItemButton onClick={() => navigate("/dashboard")}>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        
        <ListItemButton onClick={() => navigate("/agentes")}>
          <ListItemText primary="Agentes" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate("/prodotti")}>
          <ListItemText primary="Prodotti" />
        </ListItemButton>
        
      </List>
    </Drawer>
  );
}
