import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BranchProvider } from './contexts/BranchContext'

createRoot(document.getElementById("root")!).render(
  <BranchProvider>
    <App />
  </BranchProvider>
);
