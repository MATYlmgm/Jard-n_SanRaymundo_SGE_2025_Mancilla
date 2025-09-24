// backend/controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    // La consulta ahora también pide el rol_id y el cui_docente
    const userQuery = await pool.query(
      'SELECT id_usuario, username, password, rol_id, cui_docente FROM usuarios WHERE username = $1 AND estado_id = 1', 
      [username]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ msg: 'Usuario no encontrado o inactivo.' });
    }

    const user = userQuery.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Contraseña incorrecta.' });
    }

    const payload = {
      user: {
        id: user.id_usuario,
        username: user.username,
        role: user.rol_id,
        cui_docente: user.cui_docente 
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        // --- ESTA ES LA CORRECCIÓN CLAVE ---
        // Ahora la respuesta incluye el 'accessToken' y el objeto 'user'
        res.json({
          accessToken: token,
          user: payload.user // Enviamos el mismo objeto que usamos para firmar el token
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
};

module.exports = {
  loginUser
};