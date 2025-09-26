import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/DocentesDashboard.css';

export default function DocentesDashboard() {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDocentes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setDocentes(res.data);
    } catch (err) {
      setError('No se pudieron cargar los docentes. Inténtelo de nuevo.');
      console.error('Error fetching teachers', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDocentes();
  }, []);

  const handleDeactivate = async (cui, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas dar de baja a ${nombre}? Esta acción también desactivará su cuenta de usuario.`)) {
      try {
        const token = localStorage.getItem('accessToken');
        
        await axios.put(`${process.env.REACT_APP_API_URL}/api/teachers/deactivate/${cui}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });

        fetchDocentes(); 
        alert('Docente dado de baja con éxito.');
      } catch (error) {
        alert('Error al dar de baja al docente.');
        console.error('Error deactivating teacher', error);
      }
    }
  };

  if (loading) return <div className="dd-page"><div>Cargando docentes...</div></div>;
  if (error) return <div className="dd-page"><div className="dd-error">{error}</div></div>;

  return (
    <div className="dd-page">
      <div className="dd-container">
        <header className="dd-header">
          <h1>Gestión de Docentes</h1>
          <p>Administra al personal docente del colegio</p>
        </header>

        <div className="dd-actions-bar">
          <button className="dd-btn dd-btn--secondary" onClick={() => navigate('/coordinator/dashboard')}>
            ⬅ Volver al Panel
          </button>
          <button className="dd-btn dd-btn--primary" onClick={() => navigate('/docentes/registro')}>
            + Registrar Nuevo Docente
          </button>
        </div>
        <main className="dd-grid">
          {docentes.map((docente) => (
            <article key={docente.cui_docente} className="dd-card">
              <div className="dd-card-info">
                <h3 className="dd-teacher-name">{docente.nombre_completo}</h3>
                <p className="dd-details">
                  <strong>CUI:</strong> {docente.cui_docente} <br />
                  <strong>Usuario:</strong> {docente.username || 'No asignado'} <br />
                  <strong>Email:</strong> {docente.email || 'No especificado'}
                </p>
              </div>
              <div className={`dd-badge ${docente.estado_id === 1 ? 'active' : 'inactive'}`}>
                {docente.estado_id === 1 ? 'Activo' : 'Inactivo'}
              </div>
              <div className="dd-card-actions">
                <button 
                  className="dd-chip dd-chip-edit" 
                  onClick={() => navigate(`/docentes/editar/${docente.cui_docente}`)}
                >
                  ✏️ Modificar
                </button>
                <button
                  className="dd-chip dd-chip-delete"
                  onClick={() => handleDeactivate(docente.cui_docente, docente.nombre_completo)}
                  disabled={docente.estado_id !== 1}
                >
                  🗑️ Dar de Baja
                </button>
              </div>
            </article>
          ))}
        </main>
      </div>
    </div>
  );
}