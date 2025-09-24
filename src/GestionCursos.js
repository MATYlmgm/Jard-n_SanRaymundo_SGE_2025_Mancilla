import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/GestionCursos.css';

const GestionCursos = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [grados, setGrados] = useState([]);
  
  const [form, setForm] = useState({
    nombre_curso: '',
    descripcion_curso: '',
    id_grado: '',
  });

  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL; // Variable para la URL de la API

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      setLoading(true);
      const [cursosRes, gradosRes] = await Promise.all([
        // ✅ CORRECCIÓN: Se usa la variable de entorno
        axios.get(`${API_URL}/api/cursos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/grades`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCursos(cursosRes.data);
      setGrados(gradosRes.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert('No se pudieron cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const payload = {
      ...form,
      id_grado: form.id_grado === '' ? null : Number(form.id_grado),
    };
    try {
      // ✅ CORRECCIÓN: Se usa la variable de entorno
      await axios.post(`${API_URL}/api/cursos`, payload, { headers: { Authorization: `Bearer ${token}` } });
      alert('Curso creado con éxito.');
      setForm({ nombre_curso: '', descripcion_curso: '', id_grado: '' }); // Limpiar formulario
      fetchData(); // Recargar la lista de cursos
    } catch (error) {
      console.error("Error al crear el curso:", error);
      alert('Error al crear el curso: ' + (error.response?.data?.msg || 'Error desconocido.'));
    }
  };

  const handleDelete = async (cursoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.')) {
      const token = localStorage.getItem('accessToken');
      try {
        // ✅ CORRECCIÓN: Se usa la variable de entorno
        await axios.delete(`${API_URL}/api/cursos/${cursoId}`, { headers: { Authorization: `Bearer ${token}` } });
        alert('Curso eliminado con éxito.');
        fetchData(); // Recargar la lista
      } catch (error) {
        console.error("Error al eliminar el curso:", error);
        alert('Error al eliminar el curso: ' + (error.response?.data?.msg || 'Puede que esté en uso.'));
      }
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="gc-page">
      <div className="gc-container">
        <header className="gc-header">
          <h1>Gestión de Cursos</h1>
          <p>Crea, visualiza y administra los cursos del colegio.</p>
        </header>

        <button className="gc-btn-volver" onClick={() => navigate('/coordinator/dashboard')}>
          ⬅ Volver al Panel de Coordinador
        </button>

        <div className="gc-grid">
          <div className="gc-card">
            <h2>Agregar Nuevo Curso</h2>
            <form onSubmit={handleSubmit} className="gc-form">
              <input type="text" name="nombre_curso" value={form.nombre_curso} onChange={handleChange} placeholder="Nombre del Curso (ej. Matemática I)" required />
              <textarea name="descripcion_curso" value={form.descripcion_curso} onChange={handleChange} placeholder="Descripción breve del curso" required rows="3"></textarea>
              <select name="id_grado" value={form.id_grado} onChange={handleChange}>
                <option value="">Curso General (sin grado específico)</option>
                {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
              </select>
              <button type="submit" className="gc-btn gc-btn--primary">Crear Curso</button>
            </form>
          </div>
          
          <div className="gc-card">
            <h2>Cursos Existentes</h2>
            <div className="gc-list">
              {cursos.map(c => (
                <div key={c.id_curso} className="gc-list-item">
                  <div>
                    <strong className="gc-curso-nombre">{c.nombre_curso}</strong>
                    <span className="gc-detalle">{c.descripcion_curso}</span>
                    <span className="gc-grado">{c.nombre_grado || 'General'}</span>
                  </div>
                  <button className="gc-delete-btn" onClick={() => handleDelete(c.id_curso)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionCursos;