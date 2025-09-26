import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { auth } from "./auth";
import './css/TeacherDashboard.css';


const TaskModal = ({ assignmentId, courses, taskToEdit, onClose, onSave }) => {
    const [form, setForm] = useState({ titulo: '', fecha_entrega: '', id_curso: '' });

    useEffect(() => {
        if (taskToEdit) {
            setForm({
                titulo: taskToEdit.titulo,
                fecha_entrega: new Date(taskToEdit.fecha_entrega).toISOString().split('T')[0],
                id_curso: taskToEdit.id_curso
            });
        } else if (courses && courses.length > 0) {
            setForm(prev => ({ titulo: '', fecha_entrega: '', id_curso: courses[0].id_curso }));
        }
    }, [taskToEdit, courses]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.titulo.trim() || !form.fecha_entrega || !form.id_curso) {
            alert("Por favor, complete todos los campos.");
            return;
        }
        
        const token = localStorage.getItem("accessToken");
        const API_URL = process.env.REACT_APP_API_URL;
        const method = taskToEdit ? 'put' : 'post';
        const url = `${API_URL}/api/teachers/tasks${taskToEdit ? `/${taskToEdit.id_tarea}` : ''}`;
        const payload = taskToEdit ? form : { ...form, id_asignacion: assignmentId };

        try {
            const res = await axios[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });
            onSave(res.data, !!taskToEdit);
        } catch (err) {
            alert("Error al guardar la tarea: " + (err.response?.data?.msg || err.message));
        }
    };

    return (
        <div className="tdb-modal">
            <div className="tdb-modalCard">
                <div className="tdb-modalHeader">
                    <h3>{taskToEdit ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}</h3>
                    <button className="tdb-x" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="tdb-form">
                        <div className="tdb-formCol">
                            <label className="tdb-label">Curso</label>
                            <select name="id_curso" className="tdb-select" value={form.id_curso} onChange={handleChange} required>
                                <option value="" disabled>-- Seleccione un curso --</option>
                                {courses.map(c => (
                                    <option key={c.id_curso} value={c.id_curso}>{c.nombre_curso}</option>
                                ))}
                            </select>
                        </div>
                        <div className="tdb-formCol">
                            <label className="tdb-label">Título de la tarea</label>
                            <input name="titulo" className="tdb-input" value={form.titulo} onChange={handleChange} required />
                        </div>
                        <div className="tdb-formCol">
                            <label className="tdb-label">Fecha de entrega</label>
                            <input name="fecha_entrega" type="date" className="tdb-input" value={form.fecha_entrega} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="tdb-modalActions">
                        <button type="button" className="tdb-btn tdb-btn--secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="tdb-btn tdb-btn--primary">Guardar Tarea</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Componente Principal ---
const FullTeacherDashboard = () => {
    const navigate = useNavigate();
    const { cui } = useParams();
  
    const [assignments, setAssignments] = useState([]);
    const [currentAssignment, setCurrentAssignment] = useState(null);
    const [students, setStudents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [deliveries, setDeliveries] = useState({});
    const [loading, setLoading] = useState({ assignments: true, data: false });
    const [error, setError] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [currentCourses, setCurrentCourses] = useState([]);
    const [editingTask, setEditingTask] = useState(null);
    const [isSendingAll, setIsSendingAll] = useState(false);
    const [sendingCui, setSendingCui] = useState(null);
  
    const loggedInUser = auth.getUser();
    const isCoordinatorView = !!cui;
    const targetCui = cui || loggedInUser?.cui_docente;
  
    const handleSendReminders = async (studentCUIs = []) => {
      const targetCUIs = studentCUIs.length > 0 ? studentCUIs : students.map(s => s.cui_estudiante);
      if (targetCUIs.length === 0) {
        return alert("No hay alumnos en la lista para notificar.");
      }
      if (targetCUIs.length > 1) setIsSendingAll(true);
      else setSendingCui(targetCUIs[0]);
  
      try {
        const token = localStorage.getItem("accessToken");
        const payload = {
          studentCUIs: targetCUIs,
          assignmentId: currentAssignment.id_asignacion,
        };
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/notifications/homework-reminder`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert(res.data.msg);
      } catch (err) {
        console.error("Error al enviar recordatorios:", err);
        alert("Error al enviar las notificaciones. " + (err.response?.data?.msg || err.message));
      } finally {
        setIsSendingAll(false);
        setSendingCui(null);
      }
    };

  const fetchData = useCallback(async () => {
      if (!targetCui) {
        setError("No se pudo identificar al docente.");
        setLoading({ assignments: false, data: false });
        return;
      }
      setLoading(p => ({ ...p, assignments: true }));
      try {
        const token = localStorage.getItem("accessToken");
        const API_URL = process.env.REACT_APP_API_URL;
        const [teacherRes, assignmentsRes] = await Promise.all([
            axios.get(`${API_URL}/api/teachers/${targetCui}`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/api/teachers/${targetCui}/assignments`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setTeacherInfo(teacherRes.data);
        setAssignments(assignmentsRes.data);
        if (assignmentsRes.data.length > 0) {
          setCurrentAssignment(assignmentsRes.data[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("No se pudieron cargar los datos del docente.");
      } finally {
        setLoading(p => ({ ...p, assignments: false }));
      }
    }, [targetCui]);
  
    useEffect(() => { fetchData(); }, [fetchData]);
  
    const fetchAssignmentData = useCallback(async () => {
      if (!currentAssignment) {
        setStudents([]); setTasks([]); setDeliveries({}); setCurrentCourses([]); return;
      }
      setLoading(p => ({ ...p, data: true }));
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await axios.get(`${API_URL}/api/teachers/assignment-data/${currentAssignment.id_asignacion}`, { headers: { Authorization: `Bearer ${token}` } });
        setCurrentCourses(res.data.courses || []);
        setStudents(res.data.students);
        setTasks(res.data.tasks);
        setDeliveries(res.data.deliveries || {});
      } catch (err) {
        console.error(`Error fetching assignment data`, err);
        setError("No se pudieron cargar los datos de la asignación.");
      } finally {
        setLoading(p => ({ ...p, data: false }));
      }
    }, [currentAssignment]);
    
    useEffect(() => { fetchAssignmentData(); }, [fetchAssignmentData]);

  const handleCheckChange = (studentId, taskId) => {
      if(isCoordinatorView) return;
      setDeliveries(prev => {
        const studentDeliveries = { ...(prev[studentId] || {}) };
        studentDeliveries[taskId] = !studentDeliveries[taskId];
        return { ...prev, [studentId]: studentDeliveries };
      });
    };
    
    const handleSaveDeliveries = async () => {
        const payload = [];
        Object.keys(deliveries).forEach(cui_estudiante => {
            Object.keys(deliveries[cui_estudiante]).forEach(id_tarea => {
                payload.push({ cui_estudiante, id_tarea, entregado: !!deliveries[cui_estudiante][id_tarea] });
            });
        });
        if (payload.length === 0) return alert("No hay cambios para guardar.");
        try {
          const token = localStorage.getItem("accessToken");
          await axios.post(`${process.env.REACT_APP_API_URL}/api/teachers/deliveries`, { deliveries: payload }, { headers: { Authorization: `Bearer ${token}` } });
          alert("¡Progreso guardado con éxito!");
        } catch(err) {
            console.error("Error saving deliveries", err);
            alert("Hubo un error al guardar el progreso.");
        }
    };
  
    const handleTaskSaved = (savedTask, isUpdate) => {
      const sortTasks = (tasksArray) => {
        return [...tasksArray].sort((a, b) => {
          if (a.nombre_curso < b.nombre_curso) return -1;
          if (a.nombre_curso > b.nombre_curso) return 1;
          return new Date(b.fecha_entrega) - new Date(a.fecha_entrega);
        });
      };
  
      if (isUpdate) {
        setTasks(prevTasks => sortTasks(prevTasks.map(task => 
            task.id_tarea === savedTask.id_tarea ? savedTask : task
        )));
      } else {
        setTasks(prev => sortTasks([...prev, savedTask]));
      }
      setShowTaskModal(false);
      setEditingTask(null);
    };

  const handleDeleteTask = async (taskId) => {
      if (!window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;
      try {
          const token = localStorage.getItem("accessToken");
          await axios.delete(`${process.env.REACT_APP_API_URL}/api/teachers/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` }});
          setTasks(prevTasks => prevTasks.filter(task => task.id_tarea !== taskId));
          alert("Tarea eliminada con éxito.");
      } catch (err) {
          alert("Error al eliminar la tarea. " + (err.response?.data?.msg || err.message));
      }
    };
  
    const logout = () => {
        if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            auth.logout();
            navigate("/login", { replace: true });
        }
    };
  
    const groupedTasks = useMemo(() => {
      return tasks.reduce((acc, task) => {
        const courseName = task.nombre_curso || 'General';
        if (!acc[courseName]) acc[courseName] = [];
        acc[courseName].push(task);
        return acc;
      }, {});
    }, [tasks]);

  return (
      <div className="tdb-page">
        <div className="tdb-container">
          {(showTaskModal || editingTask) && (
              <TaskModal 
                  assignmentId={currentAssignment?.id_asignacion} 
                  courses={currentCourses}
                  taskToEdit={editingTask} 
                  onClose={() => { setShowTaskModal(false); setEditingTask(null); }} 
                  onSave={handleTaskSaved} 
              />
          )}
          <header className="tdb-header">
            <h1>Panel de Docente: {teacherInfo?.nombre_completo || 'Cargando...'}</h1>
            <p>Seguimiento y control de tareas</p>
          </header>
          <div className="tdb-actions-bar">
            {isCoordinatorView ? (
              <button className="tdb-btn tdb-btn--secondary" onClick={() => navigate('/seleccionar-docente')}>⬅ Volver a la Selección</button>
            ) : (
              <button className="tdb-btn tdb-btn--danger" onClick={logout}>🚪 Cerrar Sesión</button>
            )}
            {!isCoordinatorView && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                <button className="tdb-btn tdb-btn--secondary" onClick={() => setShowTaskModal(true)} disabled={!currentAssignment}>+ Nueva Tarea</button>
                <button className="tdb-btn tdb-btn--primary" onClick={handleSaveDeliveries}>💾 Guardar Cambios</button>
                <button className="tdb-btn tdb-btn--whatsapp" onClick={() => handleSendReminders()} disabled={isSendingAll || !currentAssignment}>
                  {isSendingAll ? 'Enviando...' : '📱 Notificar Pendientes'}
                </button>
              </div>
            )}
          </div>
          {loading.assignments ? <p>Cargando...</p> : error ? <p style={{color: 'red'}}>{error}</p> : (
            <div className="tdb-card">
              <h2 className="tdb-card-title">Seguimiento de Tareas</h2>
              <div className="tdb-controls">
                <div className="tdb-control-group">
                  <label htmlFor="curso-select" className="tdb-label">Mis Asignaciones:</label>
                  <select id="curso-select" className="tdb-select" value={currentAssignment?.id_asignacion || ''} onChange={(e) => setCurrentAssignment(assignments.find(a => a.id_asignacion === Number(e.target.value)))} disabled={assignments.length === 0}>
                    {assignments.length === 0 ? <option>No tienes asignaciones</option> : assignments.map((a) => (
                      <option key={a.id_asignacion} value={a.id_asignacion}>{a.nombre_grado} - {a.nombre_seccion} ({a.cursos ? a.cursos.join(', ') : '...'})</option>
                    ))}
                  </select>
                </div>
              </div>
              {loading.data ? <p>Cargando alumnos...</p> : (
                <div className="tdb-track-wrapper">
                  <table className="tdb-matrix">
                    <thead>
                      <tr>
                        <th rowSpan="2" className="student-name">{currentAssignment?.nombre_grado} {currentAssignment?.nombre_seccion} ({currentAssignment?.anio})</th>
                        {Object.entries(groupedTasks).map(([courseName, courseTasks]) => (
                          <th key={courseName} colSpan={courseTasks.length} className="tdb-course-header">{courseName}</th>
                        ))}
                        <th rowSpan="2" className="tdb-action-header">Acción</th>
                      </tr>
                      <tr>
                        {tasks.map((t) => (
                          <th key={t.id_tarea} className="tdb-task-header">
                            <div className="tdb-task-title"><span className="title" title={t.titulo}>{t.titulo}</span>
                              {!isCoordinatorView && (
                                <div className="tdb-task-actions">
                                  <button onClick={() => setEditingTask(t)} title="Editar tarea">✏️</button>
                                  <button onClick={() => handleDeleteTask(t.id_tarea)} title="Eliminar tarea">🗑️</button>
                                </div>)}
                            </div>
                            <span className="date">{new Date(t.fecha_entrega).toLocaleDateString()}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.cui_estudiante}>
                          <td className="student-name"><span>{s.apellidos}, {s.nombres}</span></td>
                          {tasks.map((t) => (
                            <td key={`${s.cui_estudiante}-${t.id_tarea}`} className="task-check">
                              <input className="tdb-checkbox" type="checkbox" checked={!!deliveries[s.cui_estudiante]?.[t.id_tarea]} onChange={() => handleCheckChange(s.cui_estudiante, t.id_tarea)} disabled={isCoordinatorView} />
                            </td>
                          ))}
                          <td className="tdb-action-cell">
                            {!isCoordinatorView && (
                              <button className="tdb-btn-icon" onClick={() => handleSendReminders([s.cui_estudiante])} disabled={sendingCui === s.cui_estudiante} title="Enviar reporte de tareas pendientes">
                                {sendingCui === s.cui_estudiante ? '⏳' : '💬'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
}
export default FullTeacherDashboard;