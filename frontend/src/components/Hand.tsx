import { ICard, IHand } from "../types"
import Card from "./Card"

interface HandProps extends IHand{
    isHidden?:boolean;
}

export default function Hand(hand:HandProps) {

    return (
        <section className="flex w-full p-4">
            
            {
                hand.isHidden ? 
                    <Card rank={'2'} suit={'hearts'} isHidden={true} />
                :
                hand.cards.map((item: ICard)=>{
                    return (
                        <Card rank={item.rank} suit={item.suit}/>
                    )
                })
            }
            
        </section>
    )
}