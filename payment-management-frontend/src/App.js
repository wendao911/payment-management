import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import PaymentRecords from './pages/PaymentRecords';
import Countries from './pages/Countries';
import Banks from './pages/Banks';
import BankAccounts from './pages/BankAccounts';
import ResizeObserverErrorBoundary from './components/ResizeObserverErrorBoundary';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <div className="App">
            <ResizeObserverErrorBoundary>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/suppliers" element={
                  <ProtectedRoute>
                    <Layout>
                      <Suppliers />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/contracts" element={
                  <ProtectedRoute>
                    <Layout>
                      <Contracts />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/payments" element={
                  <ProtectedRoute>
                    <Layout>
                      <Payments />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/payment-records" element={
                  <ProtectedRoute>
                    <Layout>
                      <PaymentRecords />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/countries" element={
                  <ProtectedRoute>
                    <Layout>
                      <Countries />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/banks" element={
                  <ProtectedRoute>
                    <Layout>
                      <Banks />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/bank-accounts" element={
                  <ProtectedRoute>
                    <Layout>
                      <BankAccounts />
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </ResizeObserverErrorBoundary>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
