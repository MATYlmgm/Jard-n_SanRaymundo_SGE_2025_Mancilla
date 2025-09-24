import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/AsignarCursos.css';

const AsignarCursos = () => {
  const navigate = useNavigate();
  // Estados para datos de la API
  const [docentes, setDocentes] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- LÓGICA DE EDICIÓN ---
  const [editingId, setEditingId] = useState(null); // ID de la asignación que se está editando

  // Estados del formulario
  const initialFormState = {
    cui_docente: '',
    id_grado: '',
    id_seccion: '',
    cursos_ids: [],
    anio: new Date().getFullYear(),
  };
  const [form, setForm] = useState(initialFormState);
  const API_URL = process.env.REACT_APP_API_URL; // Variable para la URL de la API

  // Carga inicial de datos
  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      setLoading(true);
      const [docentesRes, gradosRes, asignacionesRes] = await Promise.all([
        // ✅ CORRECCIÓN: Se usa la variable de entorno
        axios.get(`${API_URL}/api/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/grades`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/asignaciones`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setDocentes(docentesRes.data);
      setGrados(gradosRes.data);
      setAsignaciones(asignacionesRes.data);
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      alert('No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGradoChange = async (gradoId) => {
    setForm({ ...form, id_grado: gradoId, id_seccion: '', cursos_ids: [] });
    if (gradoId) {
      const token = localStorage.getItem('accessToken');
      try {
        const [seccionesRes, cursosRes] = await Promise.all([
          axios.get(`${API_URL}/api/grades/${gradoId}/sections`, { headers: { Authorization: `Bearer ${token}` } }),
          // ✅ CORRECCIÓN: Se ajusta la ruta a la correcta del backend
          axios.get(`${API_URL}/api/asignaciones/cursos/${gradoId}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setSecciones(seccionesRes.data);
        setCursos(cursosRes.data);
      } catch (error) {
        console.error("Error al cargar secciones o cursos:", error);
        alert('Error al cargar datos para el grado seleccionado.');
      }
    } else {
      setSecciones([]);
      setCursos([]);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'id_grado') {
      handleGradoChange(value);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleCursoChange = (e) => {
    const cursoId = Number(e.target.value);
    const isChecked = e.target.checked;
    setForm(prevForm => {
      const newCursosIds = isChecked
        ? [...prevForm.cursos_ids, cursoId]
        : prevForm.cursos_ids.filter(id => id !== cursoId);
      return { ...prevForm, cursos_ids: newCursosIds };
    });
  };

  const handleEditClick = async (id) => {
    setEditingId(id);
    const token = localStorage.getItem('accessToken');
    try {
      const { data } = await axios.get(`${API_URL}/api/asignaciones/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await handleGradoChange(data.id_grado); // Carga las secciones y cursos para el grado
      setForm({
        cui_docente: data.cui_docente,
        id_grado: data.id_grado,
        id_seccion: data.id_seccion,
        cursos_ids: data.cursos_ids || [],
        anio: data.anio,
      });
    } catch (error) {
      alert("Error al cargar los datos para editar.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialFormState);
    setSecciones([]);
    setCursos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/asignaciones/${editingId}`, form, { headers: { Authorization: `Bearer ${token}` } });
        alert('Asignación actualizada con éxito.');
      } else {
        await axios.post(`${API_URL}/api/asignaciones`, form, { headers: { Authorization: `Bearer ${token}` } });
        alert('Asignación creada con éxito.');
      }
      handleCancelEdit();
      fetchData();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert('Error al guardar la asignación: ' + (error.response?.data?.msg || 'Error desconocido.'));
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta asignación?')) {
      const token = localStorage.getItem('accessToken');
      try {
        await axios.delete(`${API_URL}/api/asignaciones/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        alert('Asignación eliminada.');
        fetchData();
      } catch (error) {
        alert('Error al eliminar la asignación: ' + (error.response?.data?.msg || ''));
      }
    }
  };
  
  return (
    <div className="ac-page">
      <div className="ac-container">
        <header className="ac-header">
          <h1>Asignación de Cursos</h1>
          <p>Asigna docentes, grados, secciones y cursos para un año lectivo.</p>
        </header>
        <button className="ac-btn-volver" onClick={() => navigate('/coordinator/dashboard')}>
          ⬅ Volver al Panel
        </button>

        <div className="ac-grid">
          <div className="ac-card">
            <h2>{editingId ? 'Editando Asignación' : 'Nueva Asignación'}</h2>
            <form onSubmit={handleSubmit} className="ac-form">
                <label>Docente</label>
                <select name="cui_docente" value={form.cui_docente} onChange={handleChange} required>
                  <option value="">Seleccione un docente</option>
                  {docentes.map(d => <option key={d.cui_docente} value={d.cui_docente}>{d.nombre_completo}</option>)}
                </select>

                <label>Grado</label>
                <select name="id_grado" value={form.id_grado} onChange={handleChange} required>
                  <option value="">Seleccione un grado</option>
                  {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
                </select>

                <label>Sección</label>
                <select name="id_seccion" value={form.id_seccion} onChange={handleChange} required disabled={!form.id_grado}>
                  <option value="">Seleccione una sección</option>
                  {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre_seccion}</option>)}
                </select>

                <fieldset className="ac-cursos-fieldset">
                    <legend>Cursos a Impartir</legend>
                    <div className="ac-cursos-checkboxes">
                        {cursos.length > 0 ? cursos.map(c => (
                            <label key={c.id_curso}>
                                <input type="checkbox" value={c.id_curso} checked={form.cursos_ids.includes(c.id_curso)} onChange={handleCursoChange} />
                                {c.nombre_curso}
                            </label>
                        )) : <p>Seleccione un grado para ver los cursos.</p>}
                    </div>
                </fieldset>

                <label>Año</label>
                <input type="number" name="anio" value={form.anio} onChange={handleChange} required />

                <div className="ac-form-actions">
                    {editingId && (
                        <button type="button" className="ac-btn ac-btn--secondary" onClick={handleCancelEdit}>Cancelar Edición</button>
                    )}
                    <button type="submit" className="ac-btn ac-btn--primary">{editingId ? 'Guardar Cambios' : 'Crear Asignación'}</button>
                </div>
            </form>
          </div>
          <div className="ac-card">
            <h2>Asignaciones Actuales</h2>
            <div className="ac-list">
              {asignaciones.map(a => (
                <div key={a.id_asignacion} className="ac-list-item">
                  <div>
                    <strong className="ac-docente">{a.docente}</strong>
                    <span className="ac-detalle">{a.grado} {a.seccion} - {a.cursos ? a.cursos.join(', ') : 'Sin cursos'} ({a.anio})</span>
                  </div>
                  <div className="ac-item-actions">
                    <button className="ac-action-btn" onClick={() => handleEditClick(a.id_asignacion)}>✏️</button>
                    <button className="ac-action-btn ac-delete-btn" onClick={() => handleDelete(a.id_asignacion)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsignarCursos;