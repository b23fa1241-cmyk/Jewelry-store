import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { BuilderProvider } from './context/BuilderContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter><ToastProvider><AuthProvider><CartProvider><BuilderProvider><App /></BuilderProvider></CartProvider></AuthProvider></ToastProvider></BrowserRouter>
)