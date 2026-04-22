import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App/App.scss'
import App from './App/App.tsx'

const rootElement = document.getElementById('root')


if(rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <App />
        </StrictMode>,
    )
}

