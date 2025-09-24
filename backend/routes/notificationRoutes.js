// en backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { sendPaymentReminder, sendHomeworkReminder } = require('../controllers/notificationController');

router.post('/payment-reminder', authMiddleware, sendPaymentReminder);
router.post('/homework-reminder', authMiddleware, sendHomeworkReminder);

module.exports = router;