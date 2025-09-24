const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getAllParents,
    getParentById,
    registerParent,
    updateParent,
    deactivateParent,
    activateParent
} = require('../controllers/parentController');

router.get('/', authMiddleware, getAllParents);
router.get('/:cui', authMiddleware, getParentById);
router.post('/', authMiddleware, registerParent);
router.put('/:cui', authMiddleware, updateParent);
router.put('/deactivate/:cui', authMiddleware, deactivateParent);
router.put('/activate/:cui', authMiddleware, activateParent);

module.exports = router;