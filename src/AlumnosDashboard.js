import { auth } from './auth';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/AlumnosDashboard.css';

export default function AlumnosDashboard() {
  const [alumnos, setAlumnos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const role = auth.getRole();
  const backPath = role === 2 ? '/coordinator/dashboard' : '/secretary/dashboard';
  const isCoordinator = role === 2;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [alumnosRes, seccionesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/students`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/grades/sections/all`, { headers })
      ]);
      
      setAlumnos(alumnosRes.data);
      setSecciones(seccionesRes.data);
    } catch (err) {
      setError('No se pudieron cargar los datos.');
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSectionChange = async (cui_estudiante, new_id_seccion) => {
    const alumnoToUpdate = alumnos.find(a => a.cui_estudiante === cui_estudiante);
    if (!alumnoToUpdate) return;
    const updatedData = { ...alumnoToUpdate, id_seccion: new_id_seccion };
    setAlumnos(alumnos.map(a => a.cui_estudiante === cui_estudiante ? { ...a, id_seccion: new_id_seccion, nombre_seccion: secciones.find(s => s.id_seccion == new_id_seccion)?.nombre_seccion } : a));
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${process.env.REACT_APP_API_URL}/api/students/${cui_estudiante}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      alert('Error al guardar la sección.');
      fetchData();
    }
  };

  const handleDeactivate = async (cui, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas dar de baja a ${nombre}?`)) {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.put(`${process.env.REACT_APP_API_URL}/api/students/deactivate/${cui}`, {}, { headers: { Authorization: `Bearer ${token}` }});
        fetchData();
        alert('Estudiante dado de baja con éxito.');
      } catch (error) {
        alert('Error al dar de baja al estudiante.');
      }
    }
  };

  const handleActivate = async (cui, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas reactivar a ${nombre}?`)) {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.put(`${process.env.REACT_APP_API_URL}/api/students/activate/${cui}`, {}, { headers: { Authorization: `Bearer ${token}` }});
        fetchData();
        alert('Estudiante reactivado con éxito.');
      } catch (error) {
        alert('Error al reactivar al estudiante.');
      }
    }
  };

  if (loading) return <div className="ad-page"><div>Cargando alumnos...</div></div>;
  if (error) return <div className="ad-page"><div className="ad-error">{error}</div></div>;

  return (
    <div className="ad-page">
      <div className="ad-container">
        <header className="ad-header">
          <h1>Gestión de Alumnos</h1>
          <p>Administra a los estudiantes inscritos</p>
        </header>
        <div className="ad-actions-bar">
          <button className="ad-btn ad-btn--secondary" onClick={() => navigate(backPath)}>
            ⬅ Volver al Panel
          </button>
          <button className="ad-btn ad-btn--primary" onClick={() => navigate('/alumnos/registro')}>
            + Inscribir Nuevo Alumno
          </button>
        </div>
        <main className="ad-grid">
          {alumnos.map((alumno) => (
            <article key={alumno.cui_estudiante} className="ad-card">
              <div className="ad-card-info">
                <h3 className="ad-student-name">{alumno.nombre_completo}</h3>
                <p className="ad-details">
                  <strong>CUI:</strong> {alumno.cui_estudiante} <br />
                  <strong>Grado:</strong> {alumno.nombre_grado || 'No asignado'} <br />
                  <strong>Encargado:</strong> {alumno.nombre_padre || 'No asignado'}
                </p>
                {isCoordinator && (
                  <div className="ad-section-selector">
                    <label htmlFor={`seccion-${alumno.cui_estudiante}`}>Sección:</label>
                    <select
                      id={`seccion-${alumno.cui_estudiante}`}
                      value={alumno.id_seccion || ''}
                      onChange={(e) => handleSectionChange(alumno.cui_estudiante, e.target.value)}
                      disabled={!alumno.id_grado}
                    >
                      <option value="">-- Asignar --</option>
                      {secciones
                        .filter(s => s.id_grado === alumno.id_grado)
                        .map(s => (
                          <option key={s.id_seccion} value={s.id_seccion}>{s.nombre_seccion}</option>
                        ))
                      }
                    </select>
                  </div>
                )}
              </div>
              <div className={`ad-badge ${alumno.estado_id === 1 ? 'active' : 'inactive'}`}>
                {alumno.estado_id === 1 ? 'Activo' : 'Inactivo'}
              </div>
              <div className="ad-card-actions">
                <button className="ad-chip ad-chip-edit" onClick={() => navigate(`/alumnos/editar/${alumno.cui_estudiante}`)}>✏️ Modificar</button>
                {isCoordinator && (
                  <>
                    {alumno.estado_id === 1 ? (
                      <button className="ad-chip ad-chip-delete" onClick={() => handleDeactivate(alumno.cui_estudiante, alumno.nombre_completo)}>
                        🗑️ Dar de Baja
                      </button>
                    ) : (
                      <button className="ad-chip ad-chip-activate" onClick={() => handleActivate(alumno.cui_estudiante, alumno.nombre_completo)}>
                        ⬆️ Dar de Alta
                      </button>
                    )}
                  </>
                )}
              </div>
            </article>
          ))}
        </main>
      </div>
    </div>
  );
}