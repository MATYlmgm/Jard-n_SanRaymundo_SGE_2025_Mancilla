// backend/controllers/gradeController.js
const pool = require('../config/db');

const getAllGrades = async (req, res) => {
  try {
    const sql = `
      SELECT g.id_grado, g.nombre_grado
      FROM mat_jardin.grados g
      ORDER BY g.id_grado;
    `;
    const { rows } = await pool.query(sql);
    return res.json(rows);
  } catch (err) {
    console.error('Error listando grados:', err);
    return res.status(500).send('Error en el servidor');
  }
};

// --- OBTENER SECCIONES DE UN GRADO ESPECÍFICO ---
const getSectionsByGrade = async (req, res) => {
  const { gradeId } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT id_seccion, nombre_seccion FROM secciones WHERE id_grado = $1 ORDER BY nombre_seccion',
      [gradeId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando secciones:', err);
    res.status(500).send('Error en el servidor');
  }
};

const getAllSections = async (req, res) => {
  try {
    // Esta consulta trae todas las secciones y a qué grado pertenecen
    const { rows } = await pool.query(
      'SELECT id_seccion, nombre_seccion, id_grado FROM secciones ORDER BY id_grado, nombre_seccion'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listando todas las secciones:', err);
    res.status(500).send('Error en el servidor');
  }
};

module.exports = { 
  getAllGrades,
  getSectionsByGrade,
  getAllSections
 };
