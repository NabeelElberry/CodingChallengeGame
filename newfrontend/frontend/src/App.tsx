import { useState } from 'react'

import './App.css'
import { HeroPage } from './pages/HeroPage/HeroPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div >
     <HeroPage />
    </div>
  )
}

export default App
