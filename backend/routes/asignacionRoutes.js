// backend/routes/asignacionRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
    getAsignaciones,
    createAsignacion,
    deleteAsignacion,
    getCursosPorGrado,
    getAsignacionById, // <-- Importar nueva función
    updateAsignacion // <-- Importar nueva función
} = require('../controllers/asignacionController');

router.get('/', authMiddleware, getAsignaciones);
router.post('/', authMiddleware, createAsignacion);
router.put('/:id', authMiddleware, updateAsignacion); // <-- AÑADIR RUTA PUT
router.delete('/:id', authMiddleware, deleteAsignacion);
router.get('/cursos/:gradoId', authMiddleware, getCursosPorGrado);
router.get('/:id', authMiddleware, getAsignacionById);
router.put('/:id', authMiddleware, updateAsignacion);

module.exports = router;