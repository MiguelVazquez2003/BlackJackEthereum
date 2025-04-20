
import './App.css'
import Hand from './components/Hand'
import { THand } from './types'

function App() {

  const myHand: THand = { cards: [{ rank: "2", suit: "diamonds" }, { rank: "K", suit: "spades" }, { rank: "J", suit: "hearts" }] }

  return (
    <>
      <div>
        <Hand cards={myHand.cards} />
      </div>

    </>
  )
}

export default App
