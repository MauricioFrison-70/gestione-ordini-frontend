import type { Agente, AgenteRequest } from '../features/agentes/types/agente'

const API_URL = "http://localhost:8081/api/agenti";

export async function listarAgentes(): Promise<Agente[]> {
  const response = await fetch(API_URL);
  return response.json() as Promise<Agente[]>;
}

export async function criarAgente(agente: AgenteRequest): Promise<Agente> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(agente)
  });

  if (!response.ok) {
    throw new Error("Erro ao salvar agente");
  }

  return response.json() as Promise<Agente>;
}
