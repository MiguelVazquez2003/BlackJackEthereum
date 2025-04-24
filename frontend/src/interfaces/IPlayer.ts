//Interfaz para el contrato de Blackjack

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: string; // En ETH
}

export type GameResult = number; // positivo = ganado, 0 = empate, negativo = perdido


//Interfaces de firebase
export interface IGameRecord {
  userId: string;
  betAmount: number;
  winAmount: number;
  gameResult: string;
  createdAt?: string;
}

export interface IGameRecordDetails {
  gameId: string;
  userId: string;
  state: string;
  startTime: string;
  endTime: string;
  result: string;
  createdAt?: string;
}

export interface IDepositRecord {
  userId: string;
  amount: number;
  transactionHash: string;
  createdAt?: string;
}

export interface IWithdrawalRecord {
  userId: string;
  amount: number;
  transactionHash: string;
  createdAt?: string;
}

export interface ITransactionRecord {
  transId: string;
  userId: string;
  type: string;
  amount: number;
  blockchainHash: string;
  timestamp?: string;
}
