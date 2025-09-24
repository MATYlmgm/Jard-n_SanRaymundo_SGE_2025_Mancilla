import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from 'axios';
import "./css/StudentRegister.css";

export default function StudentRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    fechaNac: "",
    genero: "",
    cuiEst: "",
    cuiPadre: "",
    id_grado: "",
  });
  const [grados, setGrados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/grades`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        setGrados(res.data);
      } catch (error) {
        alert('No pude cargar los grados. Revisa la consola.');
        console.error('Error al cargar los grados', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert("Tu sesión ha expirado, por favor inicia sesión de nuevo.");
      navigate('/login');
      return;
    }

    const studentData = {
      nombres: form.nombres,
      apellidos: form.apellidos,
      fecha_nacimiento: form.fechaNac,
      genero: form.genero,
      cui_estudiante: form.cuiEst,
      cui_padre: form.cuiPadre,
      id_grado: form.id_grado,
    };
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/students`, studentData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      alert("¡Estudiante registrado con éxito!");
      navigate('/alumnos');
    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Ocurrió un error al registrar al estudiante.';
      alert(errorMsg);
      console.error('Error al registrar estudiante:', error.response);
    }
  };

  if (loading) return <div className="reg-page-bg"><div>Cargando...</div></div>;

  return (
      <div className="contenedor-formulario">
        <div className="formulario-card">
          <div className="reg-page-bg">
            <div className="reg-card">
              <header className="reg-header">
                <h1>Inscripción de Alumno</h1>
                <p>Complete el formulario para un nuevo ingreso.</p>
              </header>

              <form className="reg-form" onSubmit={onSubmit}>
                <label className="reg-label" htmlFor="nombres">Nombres</label>
                <input id="nombres" name="nombres" className="reg-input" value={form.nombres} onChange={onChange} required />

                <label className="reg-label" htmlFor="apellidos">Apellidos</label>
                <input id="apellidos" name="apellidos" className="reg-input" value={form.apellidos} onChange={onChange} required />
                
                <label className="reg-label" htmlFor="id_grado">Grado a Inscribir</label>
                <select id="id_grado" name="id_grado" className="reg-input" value={form.id_grado} onChange={onChange} required>
                  <option value="">-- Seleccione un Grado --</option>
                  {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
                </select>
                
                <label className="reg-label" htmlFor="fechaNac">Fecha de Nacimiento</label>
                <input id="fechaNac" name="fechaNac" type="date" className="reg-input" value={form.fechaNac} onChange={onChange} required />
                
                <fieldset className="reg-fieldset">
                  <legend className="reg-legend">Género</legend>
                  <div className="reg-radio-row">
                    <label className="reg-radio">
                      <input type="radio" name="genero" value="F" checked={form.genero==="F"} onChange={onChange} required />
                      <span className="reg-radio-icon">♀</span><span>Femenino</span>
                    </label>
                    <label className="reg-radio">
                      <input type="radio" name="genero" value="M" checked={form.genero==="M"} onChange={onChange} required />
                      <span className="reg-radio-icon">♂</span><span>Masculino</span>
                    </label>
                  </div>
                </fieldset>

                <label className="reg-label" htmlFor="cuiEst">CUI Estudiante</label>
                <input id="cuiEst" name="cuiEst" className="reg-input" value={form.cuiEst} onChange={onChange} required />

                <label className="reg-label" htmlFor="cuiPadre">CUI de Padre/Encargado</label>
                <input id="cuiPadre" name="cuiPadre" className="reg-input" value={form.cuiPadre} onChange={onChange} required />

                <button
                  type="button"
                  className="reg-link-btn"
                  onClick={() => navigate("/parent-register")}
                >
                  ¿El padre no está registrado? <strong>Click aquí</strong>
                </button>

                <div className="reg-actions">
                  <button className="reg-save" type="submit">Guardar</button>
                </div>
              </form>

              <footer className="reg-footer">
                <Link to="/alumnos" className="reg-back">Volver a Gestión de Alumnos</Link>
              </footer>
            </div>
          </div>
      </div>
  </div>
);
}