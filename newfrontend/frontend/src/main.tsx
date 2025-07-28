import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@mantine/core/styles.css';
import { createTheme, MantineProvider } from '@mantine/core'

const theme = createTheme({
  colors: {
    brand: [
      '#e6f0ff', '#bfdcff', '#99c8ff', '#73b5ff',
      '#4aa1f2', '#3a8ad4', '#2c74b6', '#1e5e98',
      '#10487a', '#00325c' // darker end
    ],
    conquer: [
      '#ede8ff', '#c9c0ff', '#a599ff', '#8272ff',
      '#5f5bff', '#4b47e6', '#3833cc', '#2620b3',
      '#140d99', '#030080'
    ],
  },
  primaryColor: 'conquer',
  defaultRadius: 'md',
  fontFamily: 'inherit',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
