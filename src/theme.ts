import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",

    primary: {
      main: "#1e88e5",      // Azul profundo elegante
      light: "#6ab7ff",
      dark: "#005cb2",
    },

    secondary: {
      main: "#37474f",      // Cinza grafite clássico
      light: "#62727b",
      dark: "#102027",
    },

    background: {
      default: "#121212",   // Preto suave (padrão dark moderno)
      paper: "#1e1e1e",     // Painéis escuros elegantes
    },

    text: {
      primary: "#e0e0e0",   // Cinza claro sofisticado
      secondary: "#b0bec5", // Cinza azulado elegante
    },

    success: {
      main: "#4caf50",
    },

    error: {
      main: "#ef5350",
    },
  },

  typography: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",

    h1: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#e0e0e0",
    },

    h2: {
      fontSize: "1.6rem",
      fontWeight: 600,
      color: "#e0e0e0",
    },

    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
          borderRadius: "12px",
          padding: "20px",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          padding: "10px 18px",
          fontSize: "15px",
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: "16px",
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#263238", // Cabeçalho escuro elegante
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(even)": {
            backgroundColor: "#1c1c1c", // Zebra discreta
          },
          "&:nth-of-type(odd)": {
            backgroundColor: "#212121",
          },
          "&:hover": {
            backgroundColor: "#2c2c2c !important", // Hover elegante
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
        },
      },
    },
  },
});
