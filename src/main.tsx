import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/shippori-mincho-b1/600.css'
import '@fontsource/shippori-mincho-b1/700.css'
import '@fontsource/zen-kaku-gothic-new/400.css'
import '@fontsource/zen-kaku-gothic-new/500.css'
import '@fontsource/zen-kaku-gothic-new/700.css'
import '@fontsource/yuji-syuku/400.css'
import './styles/theme.css'
import { App } from './App'

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new Error('ルート要素が見つかりません')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
