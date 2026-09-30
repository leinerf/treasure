import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import './assets/styles/index.css'
import Home from './Home'
import Root from './Root'
import Navbar from './Navbar'
import Profile from './Profile';
import Login from './Login';
import Register from './Register';
import Logout from './Logout';
import AccountSetting from './AccountSetting';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <div className="justify-center items-center flex flex-col mt-8">
      <Routes>
        <Route path="/" element={<Root/>}>
          <Route index element={<Home />} />
          <Route path="profile" element={
              <Profile />
          } />
          <Route path="logout" element={<Logout />} />
          <Route path="account-settings" element={<AccountSetting />} />
          <Route path="store" element={<div>Store</div>} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      </div>
    </BrowserRouter>
  </StrictMode>,
)