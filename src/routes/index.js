const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const placeRoutes = require('./place.routes');
const ticketRoutes = require('./ticket.routes');
const paymentRoutes = require('./payment.routes');
const reviewRoutes = require('./review.routes');
const chatRoutes = require('./chat.routes');

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/places', placeRoutes);
router.use('/tickets', ticketRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/ai', chatRoutes);

module.exports = router;