import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Login from "./pages/login";
import Register from "./pages/register";
import Game from "./pages/game";
import StatsPlayer from "./pages/statsPlayer";
import { getAuthenticatedUser } from "./utils/sessionUtils";
import Inicio from "./pages/inicio";

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
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <StatsPlayer />
            </ProtectedRoute>
          }
        />
        <Route path="/inicio" element={<Inicio />} />
      </Routes>
    </Router>
  );
}

export default App;
