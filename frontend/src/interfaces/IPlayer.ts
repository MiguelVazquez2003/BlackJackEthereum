//Interfaces para el contrato de Blackjack

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: string;
  totalLosses: string;
  hasPendingDebt: boolean;
  pendingDebtAmount: string;
  initialDeposit: string;      // Nuevo campo
  depositTimestamp: number;    // Nuevo campo
}

export type GameResult = number; // positivo = ganado, 0 = empate, negativo = perdido

export interface Game {
  timestamp: string; // Fecha y hora de la partida
  result: number; // 1: Gana, 0: Empate, -1: Pierde
  bet: string; // Apuesta en ETH
  settled: boolean; // Indica si la partida fue liquidada correctamente
}

export interface ApuestaProps {
  onApuestaComplete?: (betAmount: string) => void;
}

 export interface DepositosProps {
  onDepositComplete?: () => void;
}

// Interfaz para el historial de depósitos
export interface DepositHistory {
  amount: string;
  timestamp: number;
  date: string;
}