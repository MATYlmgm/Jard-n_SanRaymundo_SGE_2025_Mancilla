import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./css/ParentRegister.css";

export default function ParentRegister() {
  const [form, setForm] = useState({
    parentCui: "",
    parentName: "",
    phone: "",
    address: "",
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const navigate = useNavigate(); 

  const onSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert("Sesión no válida. Por favor, inicie sesión de nuevo.");
      navigate('/login');
      return;
    }

    const parentData = {
      cui_padre: form.parentCui,
      nombre_completo: form.parentName,
      direccion: form.address,
      telefono: form.phone,
      usuario_agrego: "secretaria"
    };

    const config = {
      headers: { 'Authorization': `Bearer ${token}` }
    };

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/parents`, parentData, config);
      
      alert('¡Padre/Encargado registrado con éxito!');
      navigate('/alumnos/registro');
    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Error al registrar al encargado.';
      alert(errorMsg);
      console.error("Error submitting parent:", error.response);
    }
  };

  const goBack = () => navigate(-1);

  return (
    <div className="contenedor-formulario">
        <div className="formulario-card">
          <div className="prg-page-bg">
            <div className="prg-card">
              <header className="prg-header">
                <h1>Registro de Encargado</h1>
                <p>Añada los datos del padre o encargado principal.</p>
              </header>

              <form className="prg-form" onSubmit={onSubmit}>
                <label className="prg-label">CUI del Padre/Encargado
                  <input
                    className="prg-input"
                    name="parentCui"
                    value={form.parentCui}
                    onChange={onChange}
                    placeholder="0000 00000 0000"
                    required
                  />
                </label>

                <label className="prg-label">Nombres y Apellidos del Padre
                  <input
                    className="prg-input"
                    name="parentName"
                    value={form.parentName}
                    onChange={onChange}
                    placeholder="Nombre completo"
                    required
                  />
                </label>

                <label className="prg-label">Teléfono
                  <input
                    className="prg-input"
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    placeholder="5020000-0000"
                    required
                  />
                </label>

                <label className="prg-label">Dirección
                  <textarea
                    className="prg-input prg-textarea"
                    name="address"
                    rows="3"
                    value={form.address}
                    onChange={onChange}
                    placeholder="Calle, avenida, zona, municipio…"
                  />
                </label>

                <div className="prg-actions">
                  <button type="button" className="prg-btn prg-btn--ghost" onClick={goBack}>
                    ATRAS
                  </button>
                  <button type="submit" className="prg-btn prg-btn--primary">
                    GUARDAR
                  </button>
                </div>
              </form>
            </div>
          </div>
          </div>
      </div>
  );
}