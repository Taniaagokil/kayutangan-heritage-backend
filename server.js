
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

require('dotenv').config();

// ==========================================
// IMPORT ROUTES & CONTROLLER
// ==========================================

const authRoutes = require('./src/routes/auth.routes');

const {
    generateSaranRuteGemini
} = require('./src/controllers/aiController');

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// AUTH ROUTES
// ==========================================

app.use('/api/auth', authRoutes);

// ==========================================
// 1. KONEKSI DATABASE
// ==========================================

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kayutangan_heritage'
});

global.db = db;

db.connect((err) => {
    if (err) {
        console.error('Database error:', err);
    } else {
        console.log('Database kayutangan_heritage Terhubung!');
    }
});

// ==========================================
// 2. AUTHENTICATION (LOGIN & REGISTER)
// ==========================================

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

const typoDomains = [
    'gnail.com',
    'gmal.com',
    'yaho.com',
    'gmil.com',
    'gamil.com'
];

// REGISTER

app.post('/api/auth/register', async (req, res) => {
    const {
        nama_lengkap,
        email,
        nomor_telepon,
        kata_sandi
    } = req.body;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Format email tidak valid.'
        });
    }

    const domain = email.split('@')[1];

    if (typoDomains.includes(domain)) {
        return res.status(400).json({
            success: false,
            message: 'Email salah ketik. Maksudnya gmail.com?'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(kata_sandi, 10);

        const sql = `
            INSERT INTO users
            (nama_lengkap, email, nomor_telepon, kata_sandi)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [nama_lengkap, email, nomor_telepon, hashedPassword],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({
                            success: false,
                            message: 'Email sudah terdaftar!'
                        });
                    }

                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Registrasi berhasil! Silakan login.'
                });
            }
        );

    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// LOGIN

app.post('/api/auth/login', (req, res) => {
    const { email, kata_sandi } = req.body;

    const sql = `SELECT * FROM users WHERE email = ?`;

    db.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email tidak ditemukan!'
            });
        }

        const user = results[0];

        const isMatch = await bcrypt.compare(
            kata_sandi,
            user.kata_sandi
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Password salah!'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                email: user.email,
                nomor_telepon: user.nomor_telepon
            }
        });
    });
});

// ==========================================
// 3. TIKET & PEMBAYARAN QRIS MANUAL
// ==========================================

// BELI TIKET

app.post('/api/tiket/beli', (req, res) => {
    const {
        user_id,
        nama_pengunjung,
        tanggal_kunjungan,
        waktu_kunjungan,
        kategori_pengunjung,
        jumlah_tiket
    } = req.body;

    const kode_tiket = 'KH-' + Date.now().toString().slice(-8);

    const total_harga =
        kategori_pengunjung === 'Lokal'
            ? 5000 * jumlah_tiket
            : 15000 * jumlah_tiket;

    const sql = `
        INSERT INTO tiket (
            user_id,
            kode_tiket,
            nama_pengunjung,
            tanggal_kunjungan,
            waktu_kunjungan,
            kategori_pengunjung,
            jumlah_tiket,
            total_harga,
            status_pembayaran
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu')
    `;

    db.query(
        sql,
        [
            user_id,
            kode_tiket,
            nama_pengunjung,
            tanggal_kunjungan,
            waktu_kunjungan,
            kategori_pengunjung,
            jumlah_tiket,
            total_harga
        ],
        (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                kode_tiket,
                total_harga,
                message: 'Silakan scan QRIS. Waktu pembayaran 10 menit.'
            });
        }
    );
});

// CEK STATUS TIKET

app.get('/api/tiket/status/:kode_tiket', (req, res) => {
    const sql = `
        SELECT status_pembayaran, created_at
        FROM tiket
        WHERE kode_tiket = ?
    `;

    db.query(sql, [req.params.kode_tiket], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tiket tidak ditemukan'
            });
        }

        const tiket = results[0];

        const timeDiffMinutes =
            (new Date() - new Date(tiket.created_at)) / 60000;

        if (
            timeDiffMinutes > 10 &&
            tiket.status_pembayaran === 'Menunggu'
        ) {
            db.query(
                `UPDATE tiket SET status_pembayaran = 'Batal' WHERE kode_tiket = ?`,
                [req.params.kode_tiket]
            );

            return res.json({
                success: true,
                status_pembayaran: 'Batal'
            });
        }

        res.json({
            success: true,
            status_pembayaran: tiket.status_pembayaran
        });
    });
});

// VERIFIKASI TIKET ADMIN

app.put('/api/admin/verifikasi-tiket/:kode_tiket', (req, res) => {
    const sql = `
        UPDATE tiket
        SET status_pembayaran = 'Berhasil',
            status_tiket = 'Aktif'
        WHERE kode_tiket = ?
    `;

    db.query(sql, [req.params.kode_tiket], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false
            });
        }

        res.json({
            success: true,
            message: 'Pembayaran Diterima! Tiket sekarang Aktif.'
        });
    });
});

// ==========================================
// 4. AKSES PETA & SCAN TIKET
// ==========================================

// CEK AKSES PETA

app.get('/api/tiket/cek-akses/:user_id', (req, res) => {
    const sql = `
        SELECT kode_tiket
        FROM tiket
        WHERE user_id = ?
        AND (
            status_tiket = 'Aktif'
            OR status_tiket = 'Sudah Dipakai'
        )
        AND tanggal_kunjungan = CURDATE()
    `;

    db.query(sql, [req.params.user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false
            });
        }

        if (results.length > 0) {
            res.json({
                success: true,
                akses: true
            });
        } else {
            res.json({
                success: true,
                akses: false,
                message: 'Anda belum memiliki tiket aktif untuk hari ini.'
            });
        }
    });
});

// SCAN TIKET

app.put('/api/tiket/scan/:kode_tiket', (req, res) => {
    const sql = `
        UPDATE tiket
        SET status_tiket = 'Sudah Dipakai'
        WHERE kode_tiket = ?
        AND status_tiket = 'Aktif'
    `;

    db.query(sql, [req.params.kode_tiket], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tiket tidak valid atau belum diaktifkan admin.'
            });
        }

        res.json({
            success: true,
            message: 'Tiket berhasil di-scan. Selamat datang di Kayutangan!'
        });
    });
});

// ==========================================
// 5. DATA SPOT WISATA & GEMINI AI TOUR GUIDE
// ==========================================

// AMBIL DAFTAR KATEGORI

app.get('/api/kategori', (req, res) => {
    db.query(`SELECT * FROM kategori_tempat`, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});

// AMBIL TEMPAT WISATA BERDASARKAN KATEGORI

app.get('/api/tempat/:kategori_id', (req, res) => {
    const sql = `
        SELECT *
        FROM tempat_wisata
        WHERE kategori_id = ?
    `;

    db.query(sql, [req.params.kategori_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});

// TAMBAH ULASAN TEMPAT WISATA

app.post('/api/ulasan', (req, res) => {
    const {
        tempat_id,
        user_id,
        rating,
        komentar
    } = req.body;

    const sql = `
        INSERT INTO ulasan
        (tempat_id, user_id, rating, komentar)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [tempat_id, user_id, rating, komentar],
        (err) => {
            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.json({
                success: true,
                message: 'Ulasan berhasil ditambahkan'
            });
        }
    );
});

// AMBIL TEMPLATE PERTANYAAN AI

app.get('/api/ai-template', (req, res) => {
    db.query(`SELECT * FROM ai_prompt_templates`, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false
            });
        }

        res.json({
            success: true,
            data: results.map(
                row => row.teks_pertanyaan ||
                       row.pertanyaan ||
                       row.nama_tempat
            )
        });
    });
});

// ==========================================
// GEMINI AI TOUR GUIDE
// ==========================================

// Gemini diproses melalui aiController.js
// API Key diambil dari file .env melalui controller.
// Endpoint Flutter tetap sama.

app.post(
    '/api/ai/gemini-route',
    generateSaranRuteGemini
);

// ==========================================
// JALANKAN SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend berjalan di http://localhost:${PORT}`);
});
