import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Inicio from './pages/inicio';
import Login from './pages/login';
import Register from './pages/register';
import Game from './pages/game';
import { getAuthenticatedUser } from './utils/sessionUtils';

// Componente de protección de rutas
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = !!getAuthenticatedUser();
  
  if (!isAuthenticated) {
    // Redirigir a inicio si no está autenticado
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/game" element={
          <ProtectedRoute>
            <Game />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
