import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "./auth";
import logo from './assets/logo-colegio.png';
import "./css/Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        username,
        password,
      });
      
      const { accessToken, user } = response.data;
      auth.login(accessToken, user);
      
      navigate("/panel", { replace: true });

    } catch (err) {
      const errorMessage = err.response?.data?.msg || "Error al iniciar sesión. Verifique sus credenciales.";
      setError(errorMessage);
      console.error("Login failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src={logo} alt="Logo del Colegio" className="login-logo" />
          <h1 className="login-title">Sistema de Gestión Escolar</h1>
          <p className="login-subtitle">Colegio Mixto "El Jardín"</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="login-input-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              required
              disabled={loading}
            />
          </div>
          <div className="login-input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <footer className="login-footer">
          <p>© 2025 Colegio Mixto "El Jardín". Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}