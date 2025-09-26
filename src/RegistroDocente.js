import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/RegistroDocente.css';

const RegistroDocente = () => {
  const navigate = useNavigate();
  
  const initialFormState = {
    cui_docente: '',
    nombre_completo: '',
    email: '',
    telefono: '',
    username: '',
    password: '',
    estado_id: 1,
  };

  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    
    try {
      await axios.post(`${API_URL}/api/teachers/register`, form, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert('Docente registrado con éxito.');
      setForm(initialFormState);
      navigate('/docentes'); 
    } catch (error) {
      console.error("Error al registrar docente:", error);
      alert('Error al registrar el docente: ' + (error.response?.data?.msg || 'Error desconocido.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="treg-container">
      <div className="treg-card">
        <div className="treg-header">
          <h1>Registro de Nuevo Docente</h1>
        </div>
        <form onSubmit={handleSubmit} className="treg-form">
          <label className="treg-label">Nombre Completo</label>
          <input className="treg-input" type="text" name="nombre_completo" value={form.nombre_completo} onChange={handleChange} required />

          <label className="treg-label">CUI del Docente</label>
          <input className="treg-input" type="text" name="cui_docente" value={form.cui_docente} onChange={handleChange} required />
          
          <label className="treg-label">Email (Opcional)</label>
          <input className="treg-input" type="email" name="email" value={form.email} onChange={handleChange} />
          
          <label className="treg-label">Teléfono (Opcional)</label>
          <input className="treg-input" type="tel" name="telefono" value={form.telefono} onChange={handleChange} />
          
          <label className="treg-label">Nombre de Usuario</label>
          <input className="treg-input" type="text" name="username" value={form.username} onChange={handleChange} required />
          
          <label className="treg-label">Contraseña</label>
          <div className="treg-password-wrapper">
            <input 
              className="treg-input" 
              type={showPassword ? "text" : "password"} 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              required 
            />
            <span 
              className="treg-password-toggle" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '🔒'}
            </span>
          </div>

          <div className="treg-actions">
            <button type="submit" className="treg-save" disabled={loading}>
              {loading ? 'Registrando...' : 'Guardar Docente'}
            </button>
          </div>
        </form>
        <div className="treg-footer">
          {/**/}
          <button onClick={() => navigate('/docentes')} className="treg-cancel-btn">
            Cancelar y Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistroDocente;