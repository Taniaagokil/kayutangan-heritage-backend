const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.post('/verify', paymentController.verifyPayment);
router.post('/cancel', paymentController.cancelPayment);

module.exports = router;