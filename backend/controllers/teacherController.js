const pool = require("../config/db");
const bcrypt = require('bcryptjs');

// --- OBTENER UN DOCENTE POR SU CUI ---
const getTeacherByCui = async (req, res) => {
  const { cui } = req.params;
  try {
    const query = `
      SELECT d.cui_docente, d.nombre_completo, d.grado_guia, d.email, d.telefono, d.estado_id, u.username
      FROM docentes d LEFT JOIN usuarios u ON d.cui_docente = u.cui_docente
      WHERE d.cui_docente = $1;
    `;
    const { rows } = await pool.query(query, [cui]);
    if (rows.length === 0) return res.status(404).json({ msg: 'Docente no encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error al obtener docente ${cui}:`, err.message);
    res.status(500).send("Error en el servidor");
  }
};

// --- ACTUALIZAR UN DOCENTE ---
const updateTeacher = async (req, res) => {
  const { cui } = req.params;
  const { nombre_completo, grado_guia, email, telefono, estado_id, username, password } = req.body;
  const usuario_modifico = req.user.username;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const docenteQuery = `
      UPDATE docentes SET nombre_completo = $1, grado_guia = $2, email = $3, telefono = $4,
        estado_id = $5, usuario_modifico = $6, fecha_modifico = NOW()
      WHERE cui_docente = $7
    `;
    await client.query(docenteQuery, [nombre_completo, grado_guia || null, email || null, telefono || null, estado_id, usuario_modifico, cui]);

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await client.query(
        `UPDATE usuarios SET username = $1, password = $2, estado_id = $3, usuario_modifico = $4, fecha_modifico = NOW() WHERE cui_docente = $5`,
        [username, hashedPassword, estado_id, usuario_modifico, cui]
      );
    } else {
      await client.query(
        `UPDATE usuarios SET username = $1, estado_id = $2, usuario_modifico = $3, fecha_modifico = NOW() WHERE cui_docente = $4`,
        [username, estado_id, usuario_modifico, cui]
      );
    }

    await client.query('COMMIT');
    res.json({ msg: 'Docente actualizado con éxito.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Error al actualizar docente ${cui}:`, err.message);
    if (err.code === '23505') {
        return res.status(400).json({ msg: 'El nombre de usuario ya existe para otro docente.' });
    }
    res.status(500).send("Error en el servidor");
  } finally {
    client.release();
  }
};

// --- REGISTRO COMPLETO DE DOCENTE Y USUARIO ---
const registerTeacherAndUser = async (req, res) => {
  const { cui_docente, nombre_completo, grado_guia, email, telefono, estado_id, username, password } = req.body;
  const usuario_agrego = req.user.username;

  if (!cui_docente || !nombre_completo || !estado_id || !username || !password) {
    return res.status(400).json({ msg: 'Faltan campos obligatorios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const teacherQuery = `
      INSERT INTO docentes (cui_docente, nombre_completo, grado_guia, email, telefono, estado_id, usuario_agrego) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING cui_docente`;
    await client.query(teacherQuery, [cui_docente, nombre_completo, grado_guia || null, email || null, telefono || null, estado_id, usuario_agrego]);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userQuery = `
      INSERT INTO usuarios (username, password, rol_id, cui_docente, estado_id, usuario_agrego) 
      VALUES ($1, $2, $3, $4, $5, $6)`;
    await client.query(userQuery, [username, hashedPassword, 3, cui_docente, estado_id, usuario_agrego]);
    
    await client.query('COMMIT');
    res.status(201).json({ msg: 'Docente y usuario creados con éxito.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error en el registro de docente:", err.message);
    if (err.code === '23505') {
        return res.status(400).json({ msg: 'El CUI o el nombre de usuario ya existen.' });
    }
    res.status(500).send("Error en el servidor");
  } finally {
    client.release();
  }
};

// ✅ PRIMERA CORRECCIÓN: Se construye el campo 'description' para el menú desplegable.
const getTeacherAssignments = async (req, res) => {
  try {
    const { cui } = req.params;
    if (!cui) return res.status(400).json({ msg: "No se proporcionó el CUI del docente." });
    
    const query = `
      SELECT 
        ad.id_asignacion, g.nombre_grado, s.nombre_seccion, ad.anio,
        ARRAY_AGG(c.nombre_curso ORDER BY c.nombre_curso) as cursos
      FROM asignacion_docente ad
      JOIN grados g ON ad.id_grado = g.id_grado
      JOIN secciones s ON ad.id_seccion = s.id_seccion
      LEFT JOIN asignacion_cursos_detalle acd ON ad.id_asignacion = acd.id_asignacion
      LEFT JOIN cursos c ON acd.id_curso = c.id_curso
      WHERE ad.cui_docente = $1
      GROUP BY ad.id_asignacion, g.nombre_grado, s.nombre_seccion, ad.anio
      ORDER BY g.nombre_grado, s.nombre_seccion;
    `;
    const { rows } = await pool.query(query, [cui]);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener asignaciones de docente:', err.message);
    res.status(500).send("Error en el servidor");
  }
};

// ✅ SEGUNDA CORRECCIÓN: Se añaden grado, sección y año a la respuesta.
const getAssignmentData = async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const asignacionQuery = await pool.query(
        `SELECT
            ad.id_grado, ad.id_seccion, g.nombre_grado, s.nombre_seccion, ad.anio
         FROM asignacion_docente ad
         JOIN grados g ON ad.id_grado = g.id_grado
         JOIN secciones s ON ad.id_seccion = s.id_seccion
         WHERE ad.id_asignacion = $1`,
        [assignmentId]
    );
    if (asignacionQuery.rows.length === 0) return res.status(404).json({ msg: "Asignación no encontrada" });

    const { id_grado, id_seccion, nombre_grado, nombre_seccion, anio } = asignacionQuery.rows[0];

    const cursosAsignadosQuery = await pool.query(
      `SELECT c.id_curso, c.nombre_curso FROM cursos c
       JOIN asignacion_cursos_detalle acd ON c.id_curso = acd.id_curso
       WHERE acd.id_asignacion = $1 ORDER BY c.nombre_curso`, [assignmentId]
    );

    const studentsQuery = await pool.query("SELECT cui_estudiante, nombres, apellidos FROM estudiantes WHERE id_grado = $1 AND id_seccion = $2 ORDER BY apellidos, nombres", [id_grado, id_seccion]);
    const tasksQuery = await pool.query(
      `SELECT t.id_tarea, t.titulo, t.fecha_entrega, t.id_curso, c.nombre_curso FROM tareas t
       JOIN cursos c ON t.id_curso = c.id_curso
       WHERE t.id_asignacion = $1 ORDER BY c.nombre_curso, t.fecha_entrega DESC`, [assignmentId]
    );
    const deliveriesQuery = await pool.query(`SELECT e.cui_estudiante, e.id_tarea, e.entregado FROM entregas e JOIN tareas t ON e.id_tarea = t.id_tarea WHERE t.id_asignacion = $1`, [assignmentId]);
    
    const deliveriesMap = deliveriesQuery.rows.reduce((acc, delivery) => {
      if (!acc[delivery.cui_estudiante]) acc[delivery.cui_estudiante] = {};
      acc[delivery.cui_estudiante][delivery.id_tarea] = delivery.entregado;
      return acc;
    }, {});

    res.json({ 
        grado: nombre_grado,
        seccion: nombre_seccion,
        anio: anio,
        courses: cursosAsignadosQuery.rows,
        students: studentsQuery.rows, 
        tasks: tasksQuery.rows, 
        deliveries: deliveriesMap 
    });
  } catch (err) {
    console.error('Error al obtener datos de la asignación:', err.message);
    res.status(500).send("Error en el servidor");
  }
};

// --- CREAR TAREA (Función existente) ---
const createTask = async (req, res) => {
    const { id_asignacion, id_curso, titulo, fecha_entrega } = req.body;
    try {
        const query = `
          WITH new_task AS (
            INSERT INTO tareas (id_asignacion, id_curso, titulo, fecha_entrega) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
          )
          SELECT nt.*, c.nombre_curso
          FROM new_task nt
          JOIN cursos c ON nt.id_curso = c.id_curso;
        `;
        const result = await pool.query(query, [id_asignacion, id_curso, titulo, fecha_entrega]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error al crear la tarea:", err.message);
        res.status(500).send("Error en el servidor");
    }
};

// --- GUARDAR ENTREGAS (Función existente) ---
const saveDeliveries = async (req, res) => {
    const { deliveries } = req.body;
    if (!Array.isArray(deliveries) || deliveries.length === 0) return res.status(400).json({ msg: 'No se proporcionaron datos.' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const query = `INSERT INTO entregas (cui_estudiante, id_tarea, entregado, actualizado_en) VALUES ($1, $2, $3, NOW()) ON CONFLICT (cui_estudiante, id_tarea) DO UPDATE SET entregado = EXCLUDED.entregado, actualizado_en = NOW();`;
        for (const delivery of deliveries) await client.query(query, [delivery.cui_estudiante, delivery.id_tarea, delivery.entregado]);
        await client.query('COMMIT');
        res.status(200).json({ msg: 'Entregas guardadas.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Error en el servidor");
    } finally {
        client.release();
    }
}

// --- OBTENER TODOS LOS DOCENTES ---
const getAllTeachers = async (req, res) => {
  try {
    const query = `
      SELECT
        d.cui_docente,
        d.nombre_completo,
        d.email,
        d.telefono,
        u.username,
        d.estado_id
      FROM docentes d
      LEFT JOIN usuarios u ON d.cui_docente = u.cui_docente
      ORDER BY d.nombre_completo;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error al listar los docentes:', err.message);
    res.status(500).send("Error en el servidor");
  }
};

// --- DAR DE BAJA A UN DOCENTE (SOFT DELETE) ---
const deactivateTeacher = async (req, res) => {
  const { cui } = req.params;
  const usuario_modifico = req.user.username;
  const INACTIVO_ESTADO_ID = 2; // Asumimos que el ID para 'Inactivo' es 2

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Poner como inactivo en la tabla 'docentes'
    await client.query(
      `UPDATE docentes SET estado_id = $1, usuario_modifico = $2, fecha_modifico = NOW() WHERE cui_docente = $3`,
      [INACTIVO_ESTADO_ID, usuario_modifico, cui]
    );

    // 2. Poner como inactivo en la tabla 'usuarios' para bloquear el acceso
    await client.query(
      `UPDATE usuarios SET estado_id = $1, usuario_modifico = $2, fecha_modifico = NOW() WHERE cui_docente = $3`,
      [INACTIVO_ESTADO_ID, usuario_modifico, cui]
    );

    await client.query('COMMIT');
    res.json({ msg: 'Docente dado de baja con éxito.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Error al dar de baja al docente ${cui}:`, err.message);
    res.status(500).send("Error en el servidor");
  } finally {
    client.release();
  }
};

// --- OBTENER SOLO DOCENTES CON CURSOS ASIGNADOS ---
const getAssignedTeachers = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        d.cui_docente,
        d.nombre_completo
      FROM docentes d
      JOIN asignacion_docente ad ON d.cui_docente = ad.cui_docente -- <-- CAMBIO: Nombre de tabla corregido
      WHERE d.estado_id = 1
      ORDER BY d.nombre_completo;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener docentes asignados:', err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// --- NUEVA FUNCIÓN: ACTUALIZAR UNA TAREA ---
const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { titulo, fecha_entrega, id_curso } = req.body;
    try {
        const query = `
            WITH updated_task AS (
              UPDATE tareas 
              SET titulo = $1, fecha_entrega = $2, id_curso = $3 
              WHERE id_tarea = $4 
              RETURNING *
            )
            SELECT ut.*, c.nombre_curso
            FROM updated_task ut
            JOIN cursos c ON ut.id_curso = c.id_curso;
        `;
        const result = await pool.query(query, [titulo, fecha_entrega, id_curso, taskId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Tarea no encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error al actualizar la tarea:", err.message);
        res.status(500).send("Error en el servidor");
    }
};

// --- NUEVA FUNCIÓN: ELIMINAR UNA TAREA ---
const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    try {
        const result = await pool.query('DELETE FROM tareas WHERE id_tarea = $1', [taskId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Tarea no encontrada.' });
        }
        res.json({ msg: 'Tarea eliminada con éxito.' });
    } catch (err) {
        console.error("Error al eliminar la tarea:", err.message);
        res.status(500).send("Error en el servidor");
    }
};

module.exports = {
  registerTeacherAndUser,
  getTeacherAssignments,
  getAssignmentData,
  createTask,
  saveDeliveries,
  getAllTeachers, 
  getTeacherByCui, 
  updateTeacher,
  deactivateTeacher,
  getAssignedTeachers,
  updateTask, 
  deleteTask 
};

