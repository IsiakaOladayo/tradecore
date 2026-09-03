import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-exports';
import { useAuthStore } from './lib/store';

import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Invoices   from './pages/Invoices';
import NewInvoice from './pages/NewInvoice';
import Requests   from './pages/Requests';
import NewRequest from './pages/NewRequest';
import Layout     from './components/Layout';

import './index.css';

// Amplify is configured here — the cloud team provides aws-exports.js
// after setting up Cognito, AppSync, and S3
try {
  Amplify.configure(awsConfig);
} catch {
  console.warn('AWS Amplify not configured — running in local mode');
}

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index          element={<Dashboard />} />
          <Route path="invoices"     element={<Invoices />} />
          <Route path="invoices/new" element={<NewInvoice />} />
          <Route path="requests"     element={<Requests />} />
          <Route path="requests/new" element={<NewRequest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
