import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from '@components/custom/routes/Router';
import './index.css'
// import LoginPage from '@components/Auth/AuthPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <LoginPage /> */}
    <AppRouter />
  </StrictMode>,
)
