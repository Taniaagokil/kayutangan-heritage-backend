const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authController = require('../controllers/authController');
const tiketController = require('../controllers/tiketController');

// Rute Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Rute Tiket & Peta
router.post('/tiket/beli', tiketController.beliTiket);
router.get('/tiket/status/:kode_tiket', tiketController.cekStatusBayar);
router.put('/admin/verifikasi-tiket/:kode_tiket', tiketController.verifikasiAdmin);
router.get('/tiket/cek-akses/:user_id', tiketController.cekAksesPeta);
router.put('/tiket/scan/:kode_tiket', tiketController.scanTiket);

// Route untuk mengambil Saran Langkah AI berdasarkan ikon peta
router.get('/ai/saran', aiController.getSaranByTempat);
router.get('/ai/prompts', aiController.getPrompts);
router.post('/ai/guide', aiController.getAiRouteGuide);
router.post('/ai/gemini-route', aiController.generateSaranRuteGemini);

module.exports = router;