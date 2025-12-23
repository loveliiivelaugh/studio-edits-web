import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouter } from '@components/custom/routes/Router';
import './index.css'
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    // optional: show a toast button later
    console.log('[PWA] New content available; refresh to update.');
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline.');
  },
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <LoginPage /> */}
    <AppRouter />
  </StrictMode>,
)
