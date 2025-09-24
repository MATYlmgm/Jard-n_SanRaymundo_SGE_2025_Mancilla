const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const { 
  getAllGrades, 
  getSectionsByGrade,
  getAllSections // <-- Importar la nueva función
} = require('../controllers/gradeController');

// Obtener todos los grados
router.get('/', getAllGrades);

// Obtener todas las secciones (para los selectores)
router.get('/sections/all', authMiddleware, getAllSections); // <-- AÑADIR ESTA NUEVA RUTA

// Obtener las secciones de un grado específico (ya la tenías)
router.get('/:gradeId/sections', getSectionsByGrade); 

module.exports = router;