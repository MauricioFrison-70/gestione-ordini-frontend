import { useState } from "react";
import type { Agente } from "../types/agente";

export default function ExcluirAgente() {
  const [id, setId] = useState("");
  const [agente, setAgente] = useState<Agente | null>(null);

  const buscarAgente = async () => {
    try {
      const response = await fetch(`http://localhost:8081/api/agenti/${id}`);

      if (response.ok) {
        const data = await response.json() as Agente;
        setAgente(data);
      } else {
        alert("Agente non trovato");
        setAgente(null);
      }
    } catch {
      alert("Errore di connessione");
    }
  };

  const excluir = async () => {
    const confirmar = confirm("Sei sicuro di voler eliminare questo agente?");
    if (!confirmar) return;

    try {
      const response = await fetch(`http://localhost:8081/api/agenti/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Agente eliminato con successo!");
        setId("");
        setAgente(null);
      } else {
        alert("Errore nell'eliminazione dell'agente");
      }
    } catch {
      alert("Errore di connessione");
    }
  };

  return (
    <div>
      <h1>Elimina Agente</h1>

      <label>ID dell'agente:</label>
      <br />
      <input
        type="text"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <br />
      <button onClick={buscarAgente} style={{ marginTop: "10px" }}>
        Cerca
      </button>

      {agente && (
        <div style={{ marginTop: "20px" }}>
          <h3>Agente trovato:</h3>
          <p><strong>ID:</strong> {agente.id}</p>
          <p><strong>Nome:</strong> {agente.nome}</p>

          <button
            onClick={excluir}
            style={{
              marginTop: "10px",
              backgroundColor: "red",
              color: "white",
              padding: "8px 12px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Elimina
          </button>
        </div>
      )}
    </div>
  );
}
