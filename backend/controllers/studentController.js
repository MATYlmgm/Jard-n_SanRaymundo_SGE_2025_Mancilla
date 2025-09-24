// backend/controllers/studentController.js
const pool = require('../config/db');

// --- OBTENER TODOS LOS ESTUDIANTES (VISTA PARA COORDINADOR) ---
const getAllStudentsForCoordinator = async (req, res) => {
  try {
    const query = `
      SELECT
        e.cui_estudiante,
        e.nombres || ' ' || e.apellidos AS nombre_completo,
        e.nombres,      -- <-- AÑADIR ESTA LÍNEA
        e.apellidos,    -- <-- AÑADIR ESTA LÍNEA
        e.fecha_nacimiento, -- <-- AÑADIR PARA FUTURAS ACTUALIZACIONES
        e.genero_id,        -- <-- AÑADIR PARA FUTURAS ACTUALIZACIONES
        g.nombre_grado,
        s.nombre_seccion,
        p.nombre_completo AS nombre_padre,
        ar.cui_padre,       -- <-- AÑADIR PARA FUTURAS ACTUALIZACIONES
        e.estado_id,
        e.id_grado,
        e.id_seccion
      FROM estudiantes e
      LEFT JOIN grados g ON e.id_grado = g.id_grado
      LEFT JOIN secciones s ON e.id_seccion = s.id_seccion
      LEFT JOIN alumno_responsable ar ON e.cui_estudiante = ar.cui_estudiante AND ar.principal = TRUE
      LEFT JOIN padres p ON ar.cui_padre = p.cui_padre
      ORDER BY e.apellidos, e.nombres;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error al listar estudiantes para coordinador:', err.message);
    res.status(500).send("Error en el servidor");
  }
};

// --- OBTENER UN ESTUDIANTE POR SU CUI ---
const getStudentByCui = async (req, res) => {
    const { cui } = req.params;
    try {
        const studentQuery = `
            SELECT 
                e.cui_estudiante, e.nombres, e.apellidos, e.fecha_nacimiento, e.genero_id, e.id_grado, e.id_seccion, e.estado_id,
                ar.cui_padre
            FROM estudiantes e
            LEFT JOIN alumno_responsable ar ON e.cui_estudiante = ar.cui_estudiante AND ar.principal = TRUE
            WHERE e.cui_estudiante = $1;
        `;
        const { rows } = await pool.query(studentQuery, [cui]);
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Estudiante no encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error al obtener estudiante ${cui}:`, err.message);
        res.status(500).send("Error en el servidor");
    }
};

// --- CREAR UN NUEVO ESTUDIANTE ---
const createStudent = async (req, res) => {
  const { cui_estudiante, nombres, apellidos, fecha_nacimiento, genero_id, id_grado, id_seccion, cui_padre } = req.body;
  const usuario_agrego = req.user.username; // Obtenido del token

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar el estudiante
    const newStudentRes = await client.query(
      "INSERT INTO estudiantes (cui_estudiante, nombres, apellidos, fecha_nacimiento, genero_id, id_grado, id_seccion, usuario_agrego, estado_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1) RETURNING cui_estudiante",
      [cui_estudiante, nombres, apellidos, fecha_nacimiento, genero_id, id_grado, id_seccion || null, usuario_agrego]
    );
    const createdStudentCui = newStudentRes.rows[0].cui_estudiante;

    // 2. Si se proporcionó un padre, vincularlo
    if (cui_padre) {
      await client.query(
        "INSERT INTO alumno_responsable (cui_estudiante, cui_padre, principal) VALUES ($1, $2, TRUE)",
        [createdStudentCui, cui_padre]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json({ msg: 'Estudiante creado y vinculado con éxito.' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en el registro de estudiante:', err.message);
    
    if (err.code === '23503') { // Error de llave foránea
        return res.status(400).json({ msg: 'El CUI del padre no existe. Por favor, registre al padre primero.' });
    }
    if (err.code === '23505') { // Error de CUI de estudiante duplicado
      return res.status(400).json({ msg: 'El CUI del estudiante ya está registrado.' });
    }
    res.status(500).send("Error en el servidor");
  } finally {
    client.release();
  }
};

// --- ACTUALIZAR UN ESTUDIANTE ---
const updateStudent = async (req, res) => {
    const { cui } = req.params;
    const { nombres, apellidos, fecha_nacimiento, genero_id, id_grado, id_seccion, cui_padre, estado_id } = req.body;
    const usuario_modifico = req.user.username;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Actualizar datos del estudiante
        await client.query(
            `UPDATE estudiantes SET nombres=$1, apellidos=$2, fecha_nacimiento=$3, genero_id=$4, id_grado=$5, id_seccion=$6, estado_id=$7, usuario_modifico=$8, fecha_modifico=NOW() WHERE cui_estudiante=$9`,
            [nombres, apellidos, fecha_nacimiento, genero_id, id_grado, id_seccion || null, estado_id, usuario_modifico, cui]
        );
        // 2. Actualizar el padre/responsable principal
        if (cui_padre) {
            await client.query(
                `INSERT INTO alumno_responsable (cui_estudiante, cui_padre, principal) VALUES ($1, $2, TRUE)
                 ON CONFLICT (cui_estudiante, cui_padre) DO UPDATE SET principal = TRUE`,
                [cui, cui_padre]
            );
            await client.query(
                `UPDATE alumno_responsable SET principal = FALSE WHERE cui_estudiante = $1 AND cui_padre != $2`,
                [cui, cui_padre]
            );
        }
        await client.query('COMMIT');
        res.json({ msg: 'Estudiante actualizado con éxito' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar estudiante:', err.message);
        res.status(500).send('Error en el servidor');
    } finally {
        client.release();
    }
};

// --- DAR DE BAJA A UN ESTUDIANTE (SOFT DELETE) ---
const deactivateStudent = async (req, res) => {
    const { cui } = req.params;
    const usuario_modifico = req.user.username;
    const INACTIVO_ESTADO_ID = 2; // Asumiendo 2 = Inactivo
    try {
        await pool.query(
            'UPDATE estudiantes SET estado_id = $1, usuario_modifico = $2, fecha_modifico = NOW() WHERE cui_estudiante = $3',
            [INACTIVO_ESTADO_ID, usuario_modifico, cui]
        );
        res.json({ msg: 'Estudiante dado de baja con éxito' });
    } catch (err) {
        console.error('Error al dar de baja al estudiante:', err.message);
        res.status(500).send('Error en el servidor');
    }
};

// --- REACTIVAR A UN ESTUDIANTE ---
const activateStudent = async (req, res) => {
    const { cui } = req.params;
    const usuario_modifico = req.user.username;
    const ACTIVO_ESTADO_ID = 1; // Asumiendo 1 = Activo
    try {
        await pool.query(
            'UPDATE estudiantes SET estado_id = $1, usuario_modifico = $2, fecha_modifico = NOW() WHERE cui_estudiante = $3',
            [ACTIVO_ESTADO_ID, usuario_modifico, cui]
        );
        res.json({ msg: 'Estudiante reactivado con éxito' });
    } catch (err) {
        console.error('Error al reactivar al estudiante:', err.message);
        res.status(500).send('Error en el servidor');
    }
};

// --- FUNCIONES PARA SECRETARÍA ---
// --- Obtener todos los estudiantes ---
const getAllStudents = async (req, res) => {
  try {
    const allStudents = await pool.query("SELECT * FROM estudiantes ORDER BY apellidos, nombres");
    res.json(allStudents.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// --- Vincular un Padre a un Estudiante ---
const linkParentToStudent = async (req, res) => {
  const { cui_estudiante, cui_padre } = req.body;
  try {
    await pool.query(
      "INSERT INTO alumno_responsable (cui_estudiante, cui_padre, principal) VALUES ($1, $2, TRUE)",
      [cui_estudiante, cui_padre]
    );
    res.status(201).json({ msg: 'Padre vinculado correctamente al estudiante.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor al vincular.');
  }
};

// --- Obtener todos los Estudiantes con detalles para Secretaría (VERSIÓN MEJORADA) ---
const getStudentsWithDetails = async (req, res) => {
  try {
    // Obtenemos el período actual en formato 'YYYY-MM', ej: '2025-09'
    const currentPeriod = new Date().toISOString().slice(0, 7);

    const query = `
      SELECT
        e.cui_estudiante,
        e.nombres || ' ' || e.apellidos AS nombre_completo,
        p.nombre_completo AS nombre_padre,
        p.telefono,
        g.nombre_grado,
        -- Ahora el estado es dinámico:
        -- Si existe un registro 'Solvente' para el mes actual, se muestra 'AL_DIA'.
        -- Si no, se muestra 'PENDIENTE'.
        CASE 
          WHEN ef.estado = 'Solvente' THEN 'AL_DIA'
          ELSE 'PENDIENTE'
        END AS estado_pago
      FROM estudiantes e
      LEFT JOIN grados g ON e.id_grado = g.id_grado
      LEFT JOIN alumno_responsable ar ON e.cui_estudiante = ar.cui_estudiante AND ar.principal = TRUE
      LEFT JOIN padres p ON ar.cui_padre = p.cui_padre
      -- Hacemos un LEFT JOIN con el estado financiero SOLO para el período actual
      LEFT JOIN estado_financiero ef ON e.cui_estudiante = ef.cui_estudiante AND ef.periodo = $1
      ORDER BY e.apellidos, e.nombres;
    `;
    const { rows } = await pool.query(query, [currentPeriod]); // Pasamos el período actual como parámetro
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// --- Marcar un estudiante como solvente para un período ---
const updateFinancialStatus = async (req, res) => {
  const { cui_estudiante, periodo } = req.body; // ej. periodo: '2025-09'

  try {
    // Usamos INSERT ... ON CONFLICT para crear o actualizar el registro.
    const query = `
      INSERT INTO estado_financiero (cui_estudiante, periodo, estado, cuotas_pendientes)
      VALUES ($1, $2, 'Solvente', 0)
      ON CONFLICT (cui_estudiante, periodo) 
      DO UPDATE SET 
        estado = EXCLUDED.estado,
        cuotas_pendientes = EXCLUDED.cuotas_pendientes,
        actualizado_en = NOW();
    `;
    await pool.query(query, [cui_estudiante, periodo]);
    res.json({ msg: 'Estado financiero actualizado a Solvente' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al actualizar el estado financiero');
  }
};

// --- OBTENER ESTADO DE MOROSIDAD DE UN ESTUDIANTE ---
const getStudentDebtStatus = async (cui_estudiante) => {
  try {
    const query = `
      SELECT SUM(cuotas_pendientes) as total_cuotas_pendientes
      FROM mat_jardin.estado_financiero
      WHERE cui_estudiante = $1 AND estado = 'PENDIENTE';
    `;
    const { rows } = await pool.query(query, [cui_estudiante]);
    if (rows.length > 0 && rows[0].total_cuotas_pendientes) {
      return parseInt(rows[0].total_cuotas_pendientes, 10);
    }
    return 0;
  } catch (error) {
    console.error(`Error al verificar la deuda del estudiante ${cui_estudiante}:`, error);
    // En caso de error, asumimos que no hay deuda para no bloquear por error.
    return 0;
  }
};

// No olvides exportar las nuevas funciones al final del archivo
module.exports = {
  getStudentDebtStatus,
  createStudent,
  getAllStudents,
  linkParentToStudent,
  getStudentsWithDetails, 
  updateFinancialStatus,
  getAllStudentsForCoordinator, 
  getStudentByCui,             
  updateStudent,                
  deactivateStudent,
  activateStudent  
};