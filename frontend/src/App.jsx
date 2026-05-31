import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MarketingApp from './apps/marketing/MarketingApp';
import PortalApp from './apps/portal/PortalApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketingApp />} />
        <Route path="/app/*" element={<PortalApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
