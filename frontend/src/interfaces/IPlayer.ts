//Interfaces para el contrato de Blackjack

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: string; // En ETH
}

export type GameResult = number; // positivo = ganado, 0 = empate, negativo = perdido

export interface Game {
  timestamp: string; // Fecha y hora de la partida
  result: number; // 1: Gana, 0: Empate, -1: Pierde
  bet: string; // Apuesta en ETH
}


