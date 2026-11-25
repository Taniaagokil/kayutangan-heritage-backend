const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');

router.post('/', ticketController.createTicket);
router.get('/user/:user_id', ticketController.getUserTickets);
router.post('/scan', ticketController.scanTicket);
router.get('/map-access/:user_id', ticketController.checkMapAccess);

module.exports = router;