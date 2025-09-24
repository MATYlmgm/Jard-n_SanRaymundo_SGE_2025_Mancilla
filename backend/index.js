// en backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Definir rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/parents', require('./routes/parentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/grades', require('./routes/gradesRoutes'));
app.use('/api/asignaciones', require('./routes/asignacionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes')); 
app.use('/api/cursos', require('./routes/cursoRoutes'));

// Ruta de prueba para verificar que el servidor funciona
app.get('/api/test', (req, res) => {
  res.status(200).send('¡El backend está conectado y funcionando!');
});

// Definir el puerto
const PORT = process.env.PORT || 4000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});