import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import "./css/EditarAlumno.css";
import { auth } from "./auth";

export default function EditarAlumno() {
  const { cui } = useParams();
  const navigate = useNavigate();
  const role = auth.getRole();
  const isCoordinator = role === 2;

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    genero_id: "",
    cui_estudiante: cui,
    cui_padre: "",
    id_grado: "",
    id_seccion: "",
    estado_id: "1",
  });
  
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const fetchData = async () => {
      try {
        const [gradosRes, padresRes, alumnoRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/grades`, { headers: { 'Authorization': `Bearer ${token}` } }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/parents`, { headers: { 'Authorization': `Bearer ${token}` } }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/students/${cui}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        setGrados(gradosRes.data);
        setPadres(padresRes.data);
        
        const alumnoData = alumnoRes.data;
        alumnoData.fecha_nacimiento = alumnoData.fecha_nacimiento.split('T')[0];
        setForm(alumnoData);
        
        if (alumnoData.id_grado) {
          const seccionesRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/grades/${alumnoData.id_grado}/sections`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setSecciones(seccionesRes.data);
        }

      } catch (error) {
        alert("Error al cargar datos.");
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cui]);

  const handleGradoChange = async (e) => {
    const gradoId = e.target.value;
    setForm(f => ({ ...f, id_grado: gradoId, id_seccion: "" }));
    if (gradoId) {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/grades/${gradoId}/sections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSecciones(res.data);
    } else {
      setSecciones([]);
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/students/${cui}`, form, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('¡Estudiante actualizado con éxito!');
      navigate('/alumnos');
    } catch (error) {
      alert('Error al actualizar: ' + (error.response?.data?.msg || "Error inesperado."));
    }
  };

  if (loading) return <div>Cargando...</div>;
  
  return (
    <div className="aedit-container">
      <div className="aedit-card">
        <header className="aedit-header">
          <h1>Editar Alumno</h1>
        </header>

        <form className="aedit-form" onSubmit={onSubmit}>
          <label className="aedit-label">CUI Estudiante (no editable)</label>
          <input className="aedit-input" value={form.cui_estudiante} disabled />
          <label className="aedit-label" htmlFor="nombres">Nombres</label>
          <input id="nombres" name="nombres" className="aedit-input" value={form.nombres} onChange={onChange} required />
          <label className="aedit-label" htmlFor="apellidos">Apellidos</label>
          <input id="apellidos" name="apellidos" className="aedit-input" value={form.apellidos} onChange={onChange} required />
          <label className="aedit-label" htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
          <input id="fecha_nacimiento" name="fecha_nacimiento" type="date" className="aedit-input" value={form.fecha_nacimiento} onChange={onChange} required />
          <label className="aedit-label" htmlFor="id_grado">Grado</label>
          <select id="id_grado" name="id_grado" className="aedit-input" value={form.id_grado} onChange={handleGradoChange} required>
            <option value="">-- Seleccione un Grado --</option>
            {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
          </select>
          {isCoordinator && (
            <>
              <label className="aedit-label" htmlFor="id_seccion">Sección</label>
              <select id="id_seccion" name="id_seccion" className="aedit-input" value={form.id_seccion} onChange={onChange} disabled={!form.id_grado}>
                <option value="">-- Seleccione una Sección --</option>
                {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre_seccion}</option>)}
              </select>
            </>
          )}
          <label className="aedit-label" htmlFor="cui_padre">Padre / Encargado Principal</label>
          <select id="cui_padre" name="cui_padre" className="aedit-input" value={form.cui_padre} onChange={onChange} required>
            <option value="">-- Seleccione un Encargado --</option>
            {padres.map(p => <option key={p.cui_padre} value={p.cui_padre}>{p.nombre_completo}</option>)}
          </select>
          <div className="aedit-actions">
            <button className="aedit-save" type="submit">Guardar Cambios</button>
          </div>
        </form>
        <footer className="aedit-footer">
          <Link to="/alumnos" className="aedit-back">Cancelar y Volver</Link>
        </footer>
      </div>
    </div>
  );
}