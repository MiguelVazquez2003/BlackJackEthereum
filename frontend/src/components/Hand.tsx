import { TCard, THand } from "../types"
import Card from "./Card"

export default function Hand(hand:THand) {

    return (
        <section className="flex w-full p-4">
            
            {
                hand.cards.map((item: TCard)=>{
                    return (
                        <Card rank={item.rank} suit={item.suit} />
                    )
                })
            }
            
        </section>
    )
}