const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

router.get('/templates', chatController.getTemplates);
router.post('/ask', chatController.askAi);

module.exports = router;