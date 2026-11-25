const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 3000;

const app = express();

// Middleware Global
app.use(cors());
app.use(express.json());

// Konfigurasi Koneksi Database MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'kayutangan_heritage'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Koneksi ke database gagal:', err);
    return;
  }
  console.log('✅ Berhasil terhubung ke database MySQL Kayutangan Heritage!');
});

app.listen(PORT, () => {
  console.log(`Backend berjalan di port ${PORT}`);
});
// Menyediakan objek db agar bisa dipakai di controllers (bisa pakai module.exports atau DI)
global.db = db;

// Panggil Main Routes
const apiRoutes = require('./routes/index');
app.use('/api', apiRoutes);

// Error Handler Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;