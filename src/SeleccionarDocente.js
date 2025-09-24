import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/SeleccionarDocente.css';

const SeleccionarDocente = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignedTeachers = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/teachers/assigned`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocentes(res.data);
      } catch (error) {
        console.error("Error fetching assigned teachers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedTeachers();
  }, []);

  if (loading) return <div className="sd-page">Cargando...</div>;

  return (
    <div className="sd-page">
      <div className="sd-container">
        <header className="sd-header">
          <h1>Seleccionar Docente</h1>
          <p>Elige un docente para ver su panel de control y seguimiento de tareas.</p>
        </header>

        <button className="sd-btn-volver" onClick={() => navigate('/coordinator/dashboard')}>
          ⬅ Volver al Panel de Coordinación
        </button>

        {docentes.length > 0 ? (
          <main className="sd-grid">
            {docentes.map((docente) => (
              <div
                key={docente.cui_docente}
                className="sd-card"
                onClick={() => navigate(`/ver-docente/${docente.cui_docente}`)}
              >
                <div className="sd-icon">👨‍🏫</div>
                <h3 className="sd-title">{docente.nombre_completo}</h3>
                <p className="sd-desc">CUI: {docente.cui_docente}</p>
              </div>
            ))}
          </main>
        ) : (
          <div className="sd-empty">
            <p>Actualmente no hay docentes con cursos asignados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeleccionarDocente;