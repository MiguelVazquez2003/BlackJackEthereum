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
import Depositos from "./pages/depositos";
import Apuesta from "./pages/apuesta";
import StatsPlayer from "./pages/statsPlayer";
import { isAuthenticated } from "./utils/sessionUtils";
import Inicio from "./pages/inicio";
import { JSX, useState } from "react";
import { Sidebar } from "./components/Sidebar";



function App() {

  const [auth, setAuth] = useState(isAuthenticated());

  //protección de rutas
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {

    if (!auth) {
      // Redirigir a inicio si no está autenticado
      return <Navigate to="/" replace />;
    }
  
    return children;
  };

  return (
    <Router>
      <div className="flex">
        {
          auth &&
          <Sidebar />
        }
        <div className={`w-full ${auth ? 'ml-64' : ''}`}>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login setAuth={setAuth}/>} />
            <Route path="/register" element={<Register setAuth={setAuth}/>} />
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