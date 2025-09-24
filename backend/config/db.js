// backend/config/db.js
// Cargar .env y Pool (como ya lo tenés)
require('dotenv').config();
const { Pool } = require('pg');

// --- CÓDIGO VIEJO CON CONEXIÓN A POSTGRES LOCAL ---
/*
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
*/

// --- NUEVO CÓDIGO CON CONEXIÓN A NEON ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// <<< AÑADE ESTO >>>
pool.on('connect', async (client) => {
  await client.query("SET search_path TO mat_jardin, public;");
});

module.exports = pool;