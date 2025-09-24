import { auth } from './auth';
import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "./css/SecretaryPayments.css";

// --- Componente del Modal (sin cambios) ---
const MessageEditorModal = ({ student, onClose, onSend }) => {
    const defaultMessage = `Estimado/a ${student.nombre_padre}, le saludamos del Colegio "El Jardín". Le recordamos amablemente que el pago de la colegiatura para el/la estudiante ${student.nombre_completo} se encuentra pendiente. ¡Gracias!`;
    const [message, setMessage] = useState(defaultMessage);
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        setIsSending(true);
        await onSend(message);
        setIsSending(false);
        onClose();
    };

    return (
        <div className="sp-modalMask">
            <div className="sp-modal">
                <div className="sp-modalHead">
                    <h3>Editar Mensaje para <span>{student.nombre_completo}</span></h3>
                    <button onClick={onClose} className="sp-close">✕</button>
                </div>
                <textarea 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)}
                    rows="5"
                    className="sp-textarea"
                />
                <div className="sp-modalFoot">
                    <button onClick={onClose} className="sp-btn sp-btn--ghost">Cancelar</button>
                    <button onClick={handleSend} disabled={isSending} className="sp-btn sp-btn--primary">
                        {isSending ? "Enviando..." : "Enviar Recordatorio"}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Componente Principal ---
export default function SecretaryPayments() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  
  const navigate = useNavigate();
  const role = auth.getRole();
  const isSecretary = role === 1; // Simplificado para mayor claridad
  const backPath = isSecretary ? '/secretary/dashboard' : '/coordinator/dashboard';


  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/students/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (err) {
      setError("No se pudieron cargar los datos de los estudiantes.");
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const markAsSolvent = async (cui_estudiante) => {
    if (window.confirm("¿Confirmas que el estudiante está solvente para el mes actual?")) {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.put(`${process.env.REACT_APP_API_URL}/api/students/financial-status/${cui_estudiante}`, 
          { estado: 'Solvente' }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Estado actualizado a solvente.");
        fetchData();
      } catch (err) {
        alert("Error al actualizar el estado.");
        console.error("Error updating status:", err);
      }
    }
  };

  // Esta función para envío individual ya estaba correcta
  const sendReminder = async (customMessage) => {
    try {
        const token = localStorage.getItem('accessToken');
        const payload = {
            studentCUIs: [editingStudent.cui_estudiante],
            customMessage: customMessage
        };
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/notifications/payment-reminder`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert(response.data.msg);
    } catch (err) {
        alert("Error al enviar el recordatorio.");
        console.error("Error sending reminder:", err);
    }
  };

  // ✅ CORRECCIÓN: Esta es la nueva función, más simple y funcional.
  const handleSendAll = async () => {
    if (!window.confirm('¿Desea enviar un recordatorio de pago a TODOS los estudiantes con estado "PENDIENTE"?')) {
      return;
    }
  
    setSendingAll(true);
  
    try {
      // 1. Filtramos para obtener solo los CUIs de los estudiantes pendientes
      const pendingStudentsCUIs = students
        .filter(student => student.estado_pago === 'PENDIENTE')
        .map(student => student.cui_estudiante);
  
      if (pendingStudentsCUIs.length === 0) {
        alert("No se encontraron estudiantes con pagos pendientes.");
        setSendingAll(false);
        return;
      }
  
      const token = localStorage.getItem('accessToken');
      const payload = {
        studentCUIs: pendingStudentsCUIs,
        // No enviamos mensaje personalizado, el backend usará el predeterminado
      };
  
      // 2. Llamamos a la ruta CORRECTA con la lista de CUIs
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/notifications/payment-reminder`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // 3. Mostramos el mensaje de resumen que nos da el backend
      alert(response.data.msg);
  
    } catch (err) {
      console.error("Error al enviar recordatorios masivos:", err);
      alert("Ocurrió un error al enviar los recordatorios. " + (err.response?.data?.msg || ""));
    } finally {
      setSendingAll(false);
    }
  };

  const filteredStudents = useMemo(() => 
    students.filter(s => 
      s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.cui_estudiante.toString().includes(searchTerm)
    ), 
    [students, searchTerm]
  );
  
  if (loading) return <div className="sp-page">Cargando...</div>;
  if (error) return <div className="sp-page"><div className="sp-error">{error}</div></div>;

  return (
    <div className="sp-page">
      {editingStudent && (
          <MessageEditorModal 
              student={editingStudent} 
              onClose={() => setEditingStudent(null)} 
              onSend={sendReminder}
          />
      )}
      <div className="sp-container">
        <header className="sp-header">
          <h1>Panel de Pagos y Solvencia</h1>
          <p>Estado financiero de los estudiantes para el mes en curso.</p>
        </header>

        <nav className="sp-navbar">
          <div>
            <button className="sp-btn sp-btn--secondary" onClick={() => navigate(backPath)}>
              ⬅ Volver al Panel
            </button>

            {isSecretary && (
              <button
                type="button"
                className="sp-btn sp-btn--primary"
                onClick={handleSendAll}
                disabled={sendingAll}
                title="Enviar recordatorio a todos los pendientes que aparecen en la lista"
                style={{ marginLeft: 8 }}
              >
                {sendingAll ? 'Enviando…' : 'Enviar recordatorios (todos)'}
              </button>
            )}
          </div>

          <input 
            type="text"
            className="sp-search"
            placeholder="Buscar por nombre o CUI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </nav>

        <section className="sp-main-content">
          <div className="sp-grid">
            {filteredStudents.map(s => (
              <article key={s.cui_estudiante} className="sp-card">
                <div className="sp-cardTop">
                  <div className="sp-cardInfo">
                    <h3 className="sp-studentName">{s.nombre_completo}</h3>
                    <p className="sp-details">
                      <strong>CUI:</strong> {s.cui_estudiante}
                      <br />
                      <strong>Padre:</strong> {s.nombre_padre || 'No asignado'}
                      <br />
                      <strong>Teléfono:</strong> {s.telefono || 'No asignado'}
                    </p>
                  </div>
                  <div className={`sp-badge ${s.estado_pago === "PENDIENTE" ? "pendiente" : "aldia"}`}>
                    {s.estado_pago === "PENDIENTE" ? "Pago pendiente" : "Al día"}
                  </div>
                </div>
                
                {isSecretary && s.estado_pago === 'PENDIENTE' && (
                  <div className="sp-actions">
                    <button className="sp-chip sp-chipYellow" onClick={() => setEditingStudent(s)}>
                      ✏️ Editar y Enviar
                    </button>
                    <button 
                      className="sp-chip sp-chipBlue" 
                      onClick={() => markAsSolvent(s.cui_estudiante)}
                    >
                      ✅ Marcar solvente
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}