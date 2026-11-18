import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import AppLayout from './app/AppLayout';
import Calculator from './app/Calculator';
import Compare from './app/Compare';
import Clients from './app/Clients';
import Rates from './app/Rates';
import Dashboard from './app/Dashboard';
import Rentals from './app/Rentals';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="rentals" element={<Rentals />} />
          <Route path="compare" element={<Compare />} />
          <Route path="clients" element={<Clients />} />
          <Route path="rates" element={<Rates />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
