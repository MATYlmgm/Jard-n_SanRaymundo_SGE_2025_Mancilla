// backend/controllers/cursoController.js
const pool = require('../config/db');

// OBTENER TODOS LOS CURSOS
const getAllCursos = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_curso, 
        c.nombre_curso, 
        c.descripcion_curso, 
        g.nombre_grado 
      FROM cursos c
      LEFT JOIN grados g ON c.id_grado = g.id_grado
      ORDER BY g.nombre_grado, c.nombre_curso;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener cursos:', err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// CREAR UN NUEVO CURSO
const createCurso = async (req, res) => {
  const { nombre_curso, descripcion_curso, id_grado } = req.body;
  const usuario_agrego = req.user.username;

  try {
    const query = `
      INSERT INTO cursos (nombre_curso, descripcion_curso, id_grado, estado_id, usuario_agrego)
      VALUES ($1, $2, $3, 1, $4) 
      RETURNING *;
    `;
    // Si id_grado es nulo, se inserta NULL
    const { rows } = await pool.query(query, [nombre_curso, descripcion_curso, id_grado || null, usuario_agrego]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear curso:', err.message);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// ELIMINAR UN CURSO
const deleteCurso = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM cursos WHERE id_curso = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Curso no encontrado.' });
    }
    res.json({ msg: 'Curso eliminado con éxito.' });
  } catch (err) {
    console.error('Error al eliminar curso:', err.message);
    // Error si el curso está en uso
    if (err.code === '23503') {
      return res.status(400).json({ msg: 'No se puede eliminar el curso porque ya está asignado a un docente.' });
    }
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

module.exports = {
  getAllCursos,
  createCurso,
  deleteCurso,
};