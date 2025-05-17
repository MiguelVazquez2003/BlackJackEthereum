import cardsImg from '../assets/cards.jpg'
import { ICard as CardType}  from '../types';

interface CardProps extends CardType {
    isHidden?: boolean;
  }

export default function Card(card: CardProps) {

    const getPosition = (rank: string, suit: string) => {
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const suits = ['spades', 'hearts', 'clubs', 'diamonds'];

        const x: number = ranks.indexOf(rank);
        const y: number = suits.indexOf(suit);
        return {x, y}
    }

    const position = getPosition(card.rank, card.suit)
    console.log(`backgroundPosition: ${position.x*100}% ${position.y*100}%`)

    const scale = 0.5;
    const root = document.querySelector(":root") as HTMLElement

    root!.style.setProperty("--cardScale", scale.toString())

    const style = {
        
        backgroundImage: `url(${cardsImg})`,
        backgroundPosition: card.isHidden ? `-${14*100}% -${0*100}%` :`-${position.x*100}% -${position.y*100}%`,
    }


    return (
        <div className='card' style={style}> 

        </div>
    )
    
}
