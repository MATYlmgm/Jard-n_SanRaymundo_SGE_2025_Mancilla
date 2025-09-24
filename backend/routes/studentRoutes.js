const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  createStudent, 
  linkParentToStudent,
  getStudentsWithDetails,  
  updateFinancialStatus,
  getAllStudentsForCoordinator,
  getStudentByCui,
  updateStudent,
  deactivateStudent,
  activateStudent
} = require('../controllers/studentController');

// --- RUTAS DE SECRETARÍA (las más específicas van primero) ---
router.get('/details', authMiddleware, getStudentsWithDetails);
router.post('/financial-status', authMiddleware, updateFinancialStatus);
router.post('/link-parent', authMiddleware, linkParentToStudent);

// --- RUTAS DE GESTIÓN (Coordinador) ---
router.get('/', authMiddleware, getAllStudentsForCoordinator);
router.post('/', authMiddleware, createStudent);
router.put('/activate/:cui', authMiddleware, activateStudent);
router.put('/deactivate/:cui', authMiddleware, deactivateStudent);
router.get('/:cui', authMiddleware, getStudentByCui); // Las rutas con parámetros van al final
router.put('/:cui', authMiddleware, updateStudent);

module.exports = router;