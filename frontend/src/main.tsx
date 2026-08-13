import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import './assets/styles/index.css'
import Home from './Home'
import Navbar from './Navbar'
import Profile from './Profile';
import Login from './Login';
import Register from './Register';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <div className="justify-center items-center flex flex-col mt-8">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={
            <Profile />
        } />
        <Route path="/store" element={<div>Store</div>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      </div>
    </BrowserRouter>
  </StrictMode>,
)