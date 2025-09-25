import { auth } from './auth';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "./css/SecretaryPayments.css";

// Componente de edición de mensaje (el que ya tenías, no cambia)
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
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  
  const navigate = useNavigate();
  const role = auth.getRole();
  const isSecretary = role === 1;
  const backPath = isSecretary ? '/secretary/dashboard' : '/coordinator/dashboard';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/students/details`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { periodo: selectedPeriod }
      });
      setStudents(res.data);
    } catch (err) {
      setError("No se pudieron cargar los datos de los estudiantes.");
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ NUEVA FUNCIÓN: Marca el mes seleccionado como pagado para un estudiante.
  const handleMarkAsPaid = async (cui_estudiante) => {
    const monthName = monthOptions.find(m => m.value === selectedPeriod)?.label || selectedPeriod;
    if (window.confirm(`¿Confirmas el pago de ${monthName} para este estudiante?`)) {
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/students/${cui_estudiante}/payments`,
                { periodo: selectedPeriod }, // Envía el mes que está seleccionado en el filtro
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Pago registrado con éxito.");
            fetchData(); // Refresca la lista para mostrar el nuevo estado
        } catch (err) {
            alert("Error al registrar el pago.");
            console.error("Error al marcar como pagado:", err);
        }
    }
  };

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

  const handleSendAll = async () => {
    const monthName = monthOptions.find(m => m.value === selectedPeriod)?.label || selectedPeriod;
    if (!window.confirm(`¿Desea enviar un recordatorio de pago a TODOS los estudiantes con estado "PENDIENTE" para ${monthName}?`)) {
      return;
    }
  
    setSendingAll(true);
  
    try {
      const pendingStudentsCUIs = students
        .filter(student => student.estado_pago === 'PENDIENTE')
        .map(student => student.cui_estudiante);
  
      if (pendingStudentsCUIs.length === 0) {
        alert("No se encontraron estudiantes con pagos pendientes para este mes.");
        setSendingAll(false);
        return;
      }
  
      const token = localStorage.getItem('accessToken');
      const payload = {
        studentCUIs: pendingStudentsCUIs,
      };
  
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/notifications/payment-reminder`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
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
  
  const year = new Date().getFullYear();
  const monthOptions = [
      { label: `Enero ${year}`, value: `${year}-01` }, { label: `Febrero ${year}`, value: `${year}-02` },
      { label: `Marzo ${year}`, value: `${year}-03` }, { label: `Abril ${year}`, value: `${year}-04` },
      { label: `Mayo ${year}`, value: `${year}-05` }, { label: `Junio ${year}`, value: `${year}-06` },
      { label: `Julio ${year}`, value: `${year}-07` }, { label: `Agosto ${year}`, value: `${year}-08` },
      { label: `Septiembre ${year}`, value: `${year}-09` }, { label: `Octubre ${year}`, value: `${year}-10` },
      { label: `Noviembre ${year}`, value: `${year}-11` }, { label: `Diciembre ${year}`, value: `${year}-12` }
  ];

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
          <p>Gestión de pagos mensuales de los estudiantes.</p>
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

          <select 
            className="sp-month-selector" 
            value={selectedPeriod} 
            onChange={e => setSelectedPeriod(e.target.value)}
          >
            {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

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
                    {/* --- AQUÍ ESTÁ LA CORRECCIÓN --- */}
                    {s.meses_adeudados >= 2 && (
                        <div className="sp-blocked-indicator">
                            🚫 Bloqueado ({s.meses_adeudados} meses)
                        </div>
                    )}
                  </div>
                  <div className={`sp-badge ${s.estado_pago === "PENDIENTE" ? "pendiente" : "aldia"}`}>
                    {s.estado_pago === "PENDIENTE" ? "Pago pendiente" : "Al día"}
                  </div>
                </div>
                
                {isSecretary && (
                  <div className="sp-actions">
                    <button className="sp-chip sp-chipYellow" onClick={() => setEditingStudent(s)}>
                      ✏️ Enviar Recordatorio
                    </button>
                    {/* ✅ CORRECCIÓN: Este botón solo aparece si el estado es PENDIENTE */}
                    {s.estado_pago === 'PENDIENTE' && (
                      <button 
                        className="sp-chip sp-chipBlue" 
                        onClick={() => handleMarkAsPaid(s.cui_estudiante)}
                      >
                        ✅ Marcar Solvente
                      </button>
                    )}
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