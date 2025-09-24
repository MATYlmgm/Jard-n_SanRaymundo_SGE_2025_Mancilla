// backend/controllers/notificationController.js
const pool = require('../config/db');
const { sendMessage } = require('../services/whatsappService');
const { getStudentDebtStatus } = require('./studentController');

const sendPaymentReminder = async (req, res) => {
  const { studentCUIs, customMessage } = req.body;

  if (!studentCUIs || !Array.isArray(studentCUIs) || studentCUIs.length === 0) {
    return res.status(400).json({ msg: 'Se requiere el CUI del estudiante.' });
  }

  try {
    let successCount = 0;
    let errorCount = 0;
    let suspendedCount = 0; // Contador para los suspendidos

    for (const cui of studentCUIs) {
        // --- ¡AQUÍ ESTÁ LA LÓGICA CLAVE! ---
        // Verificamos cuántos meses debe el estudiante
        const debtMonths = await getStudentDebtStatus(cui);

        // Si debe 2 o más meses, no enviamos el mensaje.
        if (debtMonths >= 2) {
            suspendedCount++;
            continue; // Pasamos al siguiente estudiante
        }
        // --- FIN DE LA LÓGICA CLAVE ---


      // 1. Buscar al padre del estudiante
      const parentQuery = `
        SELECT p.nombre_completo AS nombre_padre, p.telefono, e.nombres || ' ' || e.apellidos AS nombre_estudiante
        FROM padres p
        JOIN alumno_responsable ar ON p.cui_padre = ar.cui_padre
        JOIN estudiantes e ON ar.cui_estudiante = e.cui_estudiante
        WHERE ar.cui_estudiante = $1 AND ar.principal = TRUE;
      `;
      const result = await pool.query(parentQuery, [cui]);

      if (result.rows.length > 0) {
        const { nombre_padre, telefono, nombre_estudiante } = result.rows[0];
        
        // 2. Determinar qué mensaje usar
        let messageToSend = '';
        if (customMessage) {
          // Si hay mensaje personalizado, lo usamos
          messageToSend = customMessage;
        } else {
          // Si no, usamos el mensaje por defecto
          messageToSend = `Estimado/a ${nombre_padre}, le saludamos del Colegio "El Jardín". Le recordamos amablemente que el pago de la colegiatura para el/la estudiante ${nombre_estudiante} se encuentra pendiente. ¡Gracias!`;
        }

        // 3. Enviar el mensaje
        const formattedPhone = telefono.replace(/[^0-9]/g, '');
        const whatsappResult = await sendMessage(formattedPhone, messageToSend);

        if (whatsappResult.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        errorCount++;
      }
    }
    
    res.status(200).json({ msg: `Proceso completado. Mensajes enviados: ${successCount}. Errores: ${errorCount}. Notificaciones suspendidas por morosidad: ${suspendedCount}.` });

  } catch (error) {
    console.error("Error en el proceso de envío de recordatorio:", error.message);
    res.status(500).json({ msg: 'Error interno al intentar enviar el mensaje.' });
  }
};

// --- NUEVA FUNCIÓN PARA RECORDATORIOS DE TAREAS ---
const sendHomeworkReminder = async (req, res) => {
  // Recibimos una lista de CUIs de estudiantes y el ID de la asignación
  const { studentCUIs, assignmentId } = req.body;

  if (!studentCUIs || !Array.isArray(studentCUIs) || studentCUIs.length === 0 || !assignmentId) {
    return res.status(400).json({ msg: 'Datos incompletos para enviar recordatorios.' });
  }

  try {
    let successCount = 0;
    let errorCount = 0;
    let suspendedCount = 0; // Contador para los suspendidos

    // Recorremos cada CUI de estudiante que nos enviaron
    for (const cui of studentCUIs) {
        // --- ¡AQUÍ ESTÁ LA LÓGICA CLAVE! ---
        // Verificamos cuántos meses debe el estudiante
        const debtMonths = await getStudentDebtStatus(cui);

        // Si debe 2 o más meses, no enviamos el mensaje.
        if (debtMonths >= 2) {
            suspendedCount++;
            continue; // Pasamos al siguiente estudiante
        }
        // --- FIN DE LA LÓGICA CLAVE ---

      // 1. Buscamos al padre del estudiante y su teléfono
      const parentQuery = `
        SELECT p.nombre_completo AS nombre_padre, p.telefono, e.nombres || ' ' || e.apellidos AS nombre_estudiante
        FROM padres p
        JOIN alumno_responsable ar ON p.cui_padre = ar.cui_padre
        JOIN estudiantes e ON ar.cui_estudiante = e.cui_estudiante
        WHERE ar.cui_estudiante = $1 AND ar.principal = TRUE;
      `;
      const parentResult = await pool.query(parentQuery, [cui]);

      if (parentResult.rows.length > 0) {
        const { nombre_padre, telefono, nombre_estudiante } = parentResult.rows[0];

        // 2. Buscamos las tareas NO entregadas para ese estudiante en esa asignación
        const tasksQuery = `
          SELECT t.titulo
          FROM tareas t
          LEFT JOIN entregas e ON t.id_tarea = e.id_tarea AND e.cui_estudiante = $1
          WHERE t.id_asignacion = $2 AND (e.entregado IS NULL OR e.entregado = FALSE);
        `;
        const tasksResult = await pool.query(tasksQuery, [cui, assignmentId]);

        // 3. Si hay tareas pendientes, construimos y enviamos el mensaje
        if (tasksResult.rows.length > 0) {
          const missedTasks = tasksResult.rows.map(r => `"${r.titulo}"`).join(', ');
          const message = `Estimado/a ${nombre_padre}, su hijo/a ${nombre_estudiante} no entregó la(s) siguiente(s) tarea(s): ${missedTasks}. Por lo tanto, no podrá recuperar esos puntos.`;
          
          const formattedPhone = telefono.replace(/[^0-9]/g, '');
          const whatsappResult = await sendMessage(formattedPhone, message);
          
          if (whatsappResult.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      } else {
        errorCount++; // Contamos como error si no se encuentra al padre
      }
    }

    res.status(200).json({ msg: `Proceso completado. Mensajes enviados: ${successCount}. Errores: ${errorCount}. Notificaciones suspendidas por morosidad: ${suspendedCount}.` });

  } catch (error) {
    console.error("Error en el proceso de envío de recordatorios de tareas:", error.message);
    res.status(500).json({ msg: 'Error interno al intentar enviar los mensajes.' });
  }
};

// ACTUALIZA EL MODULE.EXPORTS
module.exports = { 
  sendPaymentReminder,
  sendHomeworkReminder // <-- Añade la nueva función aquí
};