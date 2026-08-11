import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/LoginScreen'; // <-- Yahan naam change kiya
import Chat from './pages/ChatScreen';   // <-- Yahan naam change kiya

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}