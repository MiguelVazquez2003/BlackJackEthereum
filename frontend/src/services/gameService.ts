import { BLACKJACK} from "../utils/constants";

// Convertir resultado del juego al formato del contrato
export function getGameResult(
  playerScore: number,
  dealerScore: number
): number {
  // Si el jugador se pasó de 21, pierde
  if (playerScore > BLACKJACK) {
    return -1;
  }

  // Si el dealer se pasó de 21, el jugador gana
  if (dealerScore > BLACKJACK) {
    return 1;
  }

  // Comparar puntuaciones
    if (playerScore > dealerScore) {
      console.log("Jugador gana");
    return 1; // Jugador gana
    } else if (playerScore < dealerScore) {
        console.log("Jugador pierde");
    return -1; // Jugador pierde
    } else {
        console.log("Empate");
    return 0; // Empate
  }
}

// Calcular el valor de una mano
export function calculateHandValue(cards: string[]): number {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    // Extraer solo el valor de la carta (sin el palo)
    const cardValue = card.slice(0, -1);

    if (cardValue === "A") {
      value += 11;
      aces += 1;
    } else if (["K", "Q", "J"].includes(cardValue)) {
      value += 10;
    } else {
      value += parseInt(cardValue);
    }
  }

  // Ajustar el valor de los ases si nos pasamos de 21
  while (value > BLACKJACK && aces > 0) {
    value -= 10; // Cambiar un as de 11 a 1
    aces -= 1;
  }

  return value;
}

// Mover funciones del juego desde game.tsx

export function dealInitialCards(): {
  dealerCards: number[];
  playerCards: number[];
} {
  const newDealerCards = [
    Math.floor(Math.random() * 13) + 1,
    Math.floor(Math.random() * 13) + 1,
  ];

  const newPlayerCards = [
    Math.floor(Math.random() * 13) + 1,
    Math.floor(Math.random() * 13) + 1,
  ];

  return { dealerCards: newDealerCards, playerCards: newPlayerCards };
}

export function calculateHandTotal(cards: number[]): number {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card === 1) {
      aces += 1;
      total += 11;
    } else {
      total += Math.min(card, 10);
    }
  }

  // Ajustar los ases si es necesario
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

export function handleDealerTurn(
  updatedPlayerCards: number[],
  currentDealerCards: number[]
): { dealerCards: number[]; result: string } {
  const newDealerCards = [...currentDealerCards];
  let dealerTotal = calculateHandTotal(newDealerCards);

  while (dealerTotal < 17) {
    const newCard = Math.floor(Math.random() * 13) + 1;
    newDealerCards.push(newCard);
    dealerTotal = calculateHandTotal(newDealerCards);
  }

  const playerTotal = calculateHandTotal(updatedPlayerCards);

  let result: string;
  if (playerTotal > 21) {
    result = "¡Te has pasado! Pierdes.";
  } else if (dealerTotal > 21) {
    result = "¡El dealer se pasó! Ganas.";
  } else if (playerTotal === dealerTotal) {
    result = "Empate.";
  } else if (playerTotal > dealerTotal) {
    result = "¡Ganas!";
  } else {
    result = "Pierdes.";
  }

  return { dealerCards: newDealerCards, result };
}

export function startNewGameState() {
  return {
    dealerCards: [],
    playerCards: [],
    gameResult: null,
    gameState: "betting",
    message: null,
  };
}

export function addRandomCardToHand(cards: number[]): number[] {
  const newCard = Math.floor(Math.random() * 13) + 1;
  return [...cards, newCard];
}
