const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
    getAllCursos, 
    createCurso, 
    deleteCurso 
} = require('../controllers/cursoController');

router.get('/', authMiddleware, getAllCursos);
router.post('/', authMiddleware, createCurso);
router.delete('/:id', authMiddleware, deleteCurso);

module.exports = router;