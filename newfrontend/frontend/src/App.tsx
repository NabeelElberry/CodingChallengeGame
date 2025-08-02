import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from "react-router-dom"  
import './App.css'
import { HeroPage } from './pages/HeroPage/HeroPage'
import { HeroHeader } from './pages/HeroPage/HeroHeader'
import { useUrl } from './store/AuthCtx'
import { HomePage } from './pages/HomePage/HomePage'
import { ProtectedRoute } from './misc/ProtectedRoute'
import axios from 'axios'

function App() {
  const [count, setCount] = useState(0)

  const authCtx = useUrl();

  return (
    <div className="flex flex-col h-full">
      <BrowserRouter>
        <HeroHeader />
        <Routes>
          <Route path="/" element={<HeroPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
         </Routes>
      </BrowserRouter>  
    </div>
  )
}

export default App
