const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const { 
  getAllGrades, 
  getSectionsByGrade,
  getAllSections 
} = require('../controllers/gradeController');

// Obtener todos los grados
router.get('/', getAllGrades);

// Obtener todas las secciones (para los selectores)
router.get('/sections/all', authMiddleware, getAllSections); 

// Obtener las secciones de un grado específico
router.get('/:gradeId/sections', getSectionsByGrade); 

module.exports = router;