const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  throw new Error('La variabile VITE_API_URL deve essere configurata per avviare l’applicazione.')
}

export const API_URL = apiUrl.replace(/\/$/, '')
