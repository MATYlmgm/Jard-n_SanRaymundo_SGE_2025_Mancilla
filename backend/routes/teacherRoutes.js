const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
    registerTeacherAndUser,
    getTeacherAssignments,
    getAssignmentData,
    createTask,
    saveDeliveries,
    getAllTeachers,
    getTeacherByCui,
    updateTeacher,
    deactivateTeacher,
    getAssignedTeachers,
    updateTask,
    deleteTask
} = require('../controllers/teacherController');

// --- Rutas específicas ---
router.post('/register', authMiddleware, registerTeacherAndUser);
router.get('/assigned', authMiddleware, getAssignedTeachers);

router.get('/:cui/assignments', authMiddleware, getTeacherAssignments); 

router.get('/assignment-data/:assignmentId', authMiddleware, getAssignmentData);
router.post('/tasks', authMiddleware, createTask);
router.post('/deliveries', authMiddleware, saveDeliveries);

// --- Rutas generales ---
router.get('/', authMiddleware, getAllTeachers);
router.put('/deactivate/:cui', authMiddleware, deactivateTeacher);
router.get('/:cui', authMiddleware, getTeacherByCui);
router.put('/:cui', authMiddleware, updateTeacher);

router.put('/tasks/:taskId', authMiddleware, updateTask);
router.delete('/tasks/:taskId', authMiddleware, deleteTask);

module.exports = router;