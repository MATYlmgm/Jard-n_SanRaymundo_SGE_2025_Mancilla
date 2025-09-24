// backend/controllers/asignacionController.js
const pool = require('../config/db');

// OBTENER TODAS LAS ASIGNACIONES ACTUALES
const getAsignaciones = async (req, res) => {
  try {
    const query = `
      SELECT 
        ad.id_asignacion,
        d.nombre_completo AS docente,
        g.nombre_grado AS grado,
        s.nombre_seccion AS seccion,
        ad.anio,
        ARRAY_AGG(c.nombre_curso) as cursos
      FROM asignacion_docente ad
      JOIN docentes d ON ad.cui_docente = d.cui_docente
      JOIN grados g ON ad.id_grado = g.id_grado
      JOIN secciones s ON ad.id_seccion = s.id_seccion
      LEFT JOIN asignacion_cursos_detalle acd ON ad.id_asignacion = acd.id_asignacion
      LEFT JOIN cursos c ON acd.id_curso = c.id_curso
      WHERE d.estado_id = 1
      GROUP BY ad.id_asignacion, d.nombre_completo, g.nombre_grado, s.nombre_seccion, ad.anio
      ORDER BY d.nombre_completo, ad.anio DESC, g.nombre_grado;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener asignaciones:', err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

const getCursosPorGrado = async (req, res) => {
    const { gradoId } = req.params;
    try {
        const query = 'SELECT id_curso, nombre_curso FROM cursos WHERE id_grado = $1 OR id_grado IS NULL ORDER BY nombre_curso';
        const { rows } = await pool.query(query, [gradoId]);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener cursos por grado:', err.message);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// CREAR UNA NUEVA ASIGNACIÓN
const createAsignacion = async (req, res) => {
  // Ahora recibimos un array 'cursos_ids' en lugar de un solo 'id_curso'
  const { cui_docente, id_grado, id_seccion, anio, cursos_ids } = req.body;
  const usuario_agrego = req.user.username;

  if (!cursos_ids || !Array.isArray(cursos_ids) || cursos_ids.length === 0) {
    return res.status(400).json({ msg: 'Debe seleccionar al menos un curso.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar en la tabla principal (ahora sin el curso)
    const asignacionQuery = `
      INSERT INTO asignacion_docente (cui_docente, id_grado, id_seccion, anio, estado_id, usuario_agrego)
      VALUES ($1, $2, $3, $4, 1, $5) -- <-- CAMBIO: Corregido a $5
      RETURNING id_asignacion;
    `;

    // La llamada a la consulta también debe coincidir con 5 parámetros
    const result = await client.query(asignacionQuery, [cui_docente, id_grado, id_seccion, anio, usuario_agrego]);
    const newAsignacionId = result.rows[0].id_asignacion;

    // 2. Insertar cada curso en la tabla detalle
    const detalleQuery = `
      INSERT INTO asignacion_cursos_detalle (id_asignacion, id_curso) VALUES ($1, $2);
    `;
    for (const id_curso of cursos_ids) {
      await client.query(detalleQuery, [newAsignacionId, id_curso]);
    }

    await client.query('COMMIT');
    res.status(201).json({ msg: 'Asignación creada con éxito.' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear asignación:', err.message);
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ msg: 'Esta asignación ya existe o contiene cursos duplicados.' });
    }
    res.status(500).json({ msg: 'Error en el servidor' });
  } finally {
    client.release();
  }
};

// ELIMINAR UNA ASIGNACIÓN
const deleteAsignacion = async (req, res) => {
  const { id } = req.params;
  try {
    // <-- CAMBIO: Usa el nuevo nombre de la tabla 'asignacion_docente'
    const result = await pool.query('DELETE FROM asignacion_docente WHERE id_asignacion = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Asignación no encontrada.' });
    }
    res.json({ msg: 'Asignación eliminada con éxito.' });
  } catch (err) {
    console.error('Error al eliminar asignación:', err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// OBTENER CURSOS POR GRADO
const getCursosByGrado = async (req, res) => {
    const { gradeId } = req.params;
    try {
        const query = 'SELECT id_curso, nombre_curso FROM cursos WHERE id_grado = $1 OR id_grado IS NULL ORDER BY nombre_curso';
        const { rows } = await pool.query(query, [gradeId]);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener cursos por grado:', err.message);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

const getAsignacionById = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Obtenemos los datos principales de la asignación
    const mainQuery = `
        SELECT cui_docente, id_grado, id_seccion, anio 
        FROM asignacion_docente WHERE id_asignacion = $1`;
    const mainResult = await pool.query(mainQuery, [id]);

    if (mainResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Asignación no encontrada' });
    }

    // 2. Obtenemos los IDs de los cursos asociados a esa asignación
    const cursosQuery = `
        SELECT id_curso 
        FROM asignacion_cursos_detalle WHERE id_asignacion = $1`;
    const cursosResult = await pool.query(cursosQuery, [id]);
    
    // Extraemos solo los IDs en un array plano, ej: [1, 5, 8]
    const cursos_ids = cursosResult.rows.map(row => row.id_curso);

    // 3. Combinamos todo en un solo objeto y lo enviamos
    const response = {
      ...mainResult.rows[0],
      cursos_ids
    };
    
    res.json(response);

  } catch (err) {
    console.error('Error al obtener la asignación por ID:', err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// ACTUALIZAR UNA ASIGNACIÓN EXISTENTE
const updateAsignacion = async (req, res) => {
    const { id } = req.params;
    const { cui_docente, id_grado, id_seccion, anio, cursos_ids } = req.body;
    const usuario_modifico = req.user.username;

    if (!cursos_ids || !Array.isArray(cursos_ids) || cursos_ids.length === 0) {
        return res.status(400).json({ msg: 'Debe seleccionar al menos un curso.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Actualizar la tabla principal 'asignacion_docente'
        const updateMainQuery = `
            UPDATE asignacion_docente
            SET cui_docente = $1, id_grado = $2, id_seccion = $3, anio = $4, 
                usuario_modifico = $5, fecha_modifico = now()
            WHERE id_asignacion = $6;
        `;
        await client.query(updateMainQuery, [cui_docente, id_grado, id_seccion, anio, usuario_modifico, id]);
        
        // 2. Borrar los cursos anteriores para evitar duplicados
        await client.query('DELETE FROM asignacion_cursos_detalle WHERE id_asignacion = $1', [id]);
        
        // 3. Insertar la nueva lista de cursos
        const detalleQuery = 'INSERT INTO asignacion_cursos_detalle (id_asignacion, id_curso) VALUES ($1, $2)';
        for (const id_curso of cursos_ids) {
            await client.query(detalleQuery, [id, id_curso]);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ msg: 'Asignación actualizada con éxito.' });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar asignación:', err.message);
        res.status(500).json({ msg: 'Error en el servidor' });
    } finally {
        client.release();
    }
};

module.exports = {
  getAsignaciones,
  getCursosPorGrado,
  createAsignacion,
  deleteAsignacion,
  getAsignacionById, 
  updateAsignacion 
};