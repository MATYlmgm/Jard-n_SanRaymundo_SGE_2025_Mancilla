const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const { 
    createStudent,
    getStudentsWithDetails,
    getFinancialStatusByCui,
    markMonthAsPaid,
    getAllStudentsForCoordinator,
    getStudentByCui,
    updateStudent,
    deactivateStudent,
    activateStudent
} = require('../controllers/studentController');

// --- RUTAS DE SECRETARÍA ---
router.get('/details', authMiddleware, getStudentsWithDetails);
// Obtiene el historial de pagos de un alumno específico
router.get('/:cui/financial-status', authMiddleware, getFinancialStatusByCui);

// Registra el pago de un mes para un alumno
router.post('/:cui/payments', authMiddleware, markMonthAsPaid);

// --- RUTAS DE GESTIÓN (Coordinador) ---
router.get('/', authMiddleware, getAllStudentsForCoordinator);
router.post('/', authMiddleware, createStudent);
router.put('/activate/:cui', authMiddleware, activateStudent);
router.put('/deactivate/:cui', authMiddleware, deactivateStudent);
router.get('/:cui', authMiddleware, getStudentByCui);
router.put('/:cui', authMiddleware, updateStudent);

module.exports = router;