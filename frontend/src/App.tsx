import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import "./App.css";
import Login from "./pages/login";
import Register from "./pages/register";
import Game from "./pages/game";
import Depositos from "./pages/depositos";
import Apuesta from "./pages/apuesta";
import StatsPlayer from "./pages/statsPlayer";
import { getAuthenticatedUser } from "./utils/sessionUtils";
import Inicio from "./pages/inicio";
import { JSX } from "react";

// Componente de protección de rutas
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = !!getAuthenticatedUser();

  if (!isAuthenticated) {
    // Redirigir a inicio si no está autenticado
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente del Sidebar
const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-secondarygreen text-white fixed flex flex-col">
      <h1 className="text-2xl font-bold text-center py-6 border-b border-gray-700">
        Blackjack
      </h1>
      <nav className="flex flex-col mt-6 space-y-4 px-4">
        <Link
          to="/inicio"
          className="py-2 px-4 rounded-lg hover:bg-gray-700 transition"
        >
          Inicio
        </Link>
        <Link
          to="/stats"
          className="py-2 px-4 rounded-lg hover:bg-gray-700 transition"
        >
          Mis Estadísticas
        </Link>
        <Link
          to="/game"
          className="py-2 px-4 rounded-lg hover:bg-gray-700 transition"
        >
          Jugar
        </Link>

      </nav>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
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
              path="/depositos"
              element={
                <ProtectedRoute>
                  <Depositos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apuesta"
              element={
                <ProtectedRoute>
                  <Apuesta />
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
        </div>
      </div>
    </Router>
  );
}

export default App;