const pool = require('../config/db'); // Importa la conexión

// --- Crear un nuevo Padre/Encargado ---
const createParent = async (req, res) => {
  const { cui_padre, nombre_completo, direccion, telefono, usuario_agrego } = req.body;

  try {
    const newParent = await pool.query(
      "INSERT INTO padres (cui_padre, nombre_completo, direccion, telefono, usuario_agrego) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [cui_padre, nombre_completo, direccion, telefono, usuario_agrego]
    );
    res.status(201).json(newParent.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// --- Obtener todos los Padres/Encargados ---
const getAllParents = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT cui_padre, nombre_completo, direccion, telefono, estado_id FROM padres ORDER BY nombre_completo');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// OBTENER UN PADRE POR SU CUI
const getParentById = async (req, res) => {
    const { cui } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM padres WHERE cui_padre = $1', [cui]);
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Padre no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// REGISTRAR UN NUEVO PADRE
const registerParent = async (req, res) => {
    const { cui_padre, nombre_completo, direccion, telefono } = req.body;
    const usuario_agrego = req.user.username;
    try {
        const newParent = await pool.query(
            "INSERT INTO padres (cui_padre, nombre_completo, direccion, telefono, usuario_agrego, fecha_agrega, estado_id) VALUES ($1, $2, $3, $4, $5, NOW(), 1) RETURNING *",
            [cui_padre, nombre_completo, direccion, telefono, usuario_agrego]
        );
        res.status(201).json(newParent.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ACTUALIZAR UN PADRE
const updateParent = async (req, res) => {
    const { cui } = req.params;
    const { nombre_completo, direccion, telefono } = req.body;
    const usuario_modifico = req.user.username;
    try {
        const updatedParent = await pool.query(
            "UPDATE padres SET nombre_completo = $1, direccion = $2, telefono = $3, usuario_modifico = $4, fecha_modifico = NOW() WHERE cui_padre = $5 RETURNING *",
            [nombre_completo, direccion, telefono, usuario_modifico, cui]
        );
        if (updatedParent.rows.length === 0) {
            return res.status(404).json({ msg: 'Padre no encontrado' });
        }
        res.json(updatedParent.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// DESACTIVAR UN PADRE (SOFT DELETE)
const deactivateParent = async (req, res) => {
    const { cui } = req.params;
    try {
        await pool.query("UPDATE padres SET estado_id = 2 WHERE cui_padre = $1", [cui]);
        res.json({ msg: 'Padre desactivado' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ACTIVAR UN PADRE
const activateParent = async (req, res) => {
    const { cui } = req.params;
    try {
        await pool.query("UPDATE padres SET estado_id = 1 WHERE cui_padre = $1", [cui]);
        res.json({ msg: 'Padre activado' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getAllParents,
    getParentById,
    registerParent,
    updateParent,
    deactivateParent,
    activateParent
};