import { ICard, IHand } from "../types";
import { BLACKJACK } from "../utils/constants";

// Convertir resultado del juego al formato del contrato
export function getGameResult(
  playerScore: number,
  dealerScore: number
): number {

    console.log("Resultado del juego: ", playerScore, dealerScore);


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
export function calculateHandValue(cards: IHand): number {
  let value = 0;
  let aces = 0;

  for (const card of cards.cards) {
    // Extraer solo el valor de la carta (sin el palo)
    const cardValue = card.rank;

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
  dealerCards: IHand;
  playerCards: IHand;
} {
  const newDealerCards: IHand = {
    cards: [getRandomCard(), getRandomCard()]
  };

  const newPlayerCards: IHand = {
    cards: [getRandomCard(), getRandomCard()]
  };

  return { dealerCards: newDealerCards, playerCards: newPlayerCards };
}

export function handleDealerTurn(
  updatedPlayerCards: IHand,
  currentDealerCards: IHand
): { dealerCards: IHand; result: string; playerTotal: number; dealerTotal: number } {
  const newDealerCards:IHand = currentDealerCards;
  let dealerTotal = calculateHandValue(newDealerCards);

  console.log("Cartas iniciales del dealer:", newDealerCards);
  console.log("Total inicial del dealer:", dealerTotal);

  while (dealerTotal < 17) {
    const newCard: ICard = getRandomCard();
    newDealerCards.cards.push(newCard);
    dealerTotal = calculateHandValue(newDealerCards);

    console.log("Nueva carta del dealer:", newCard);
    console.log("Cartas actuales del dealer:", newDealerCards);
    console.log("Total actual del dealer:", dealerTotal);
  }

  const playerTotal = calculateHandValue(updatedPlayerCards);

  console.log("Cartas del jugador:", updatedPlayerCards);
  console.log("Total del jugador:", playerTotal);

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

  console.log("Resultado del juego:", result);

  return { dealerCards: newDealerCards, result, playerTotal, dealerTotal };
}

export function startNewGameState() {
  return {
    dealerCards: {cards:[]},
    playerCards: {cards:[]},
    gameResult: 'pending',
    gameState: "betting",
    message: null,
  };
}

export function addRandomCardToHand(actualHand: IHand): IHand {
  const newHand: IHand = {
    cards: [ ...actualHand.cards, getRandomCard()]
  }
  return newHand;
}

function getRandomCard(): ICard{
  
  const ranks : string[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suits : string[] = ['spades', 'hearts', 'clubs', 'diamonds'];
  const card:ICard = {
    rank: ranks[Math.floor(Math.random() * ranks.length)],
    suit: suits[Math.floor(Math.random() * suits.length)],
  }

  return card
}