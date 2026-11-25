const db = require('../config/db');
require('dotenv').config();

// Ganti dengan API Key Gemini kamu jika belum ditaruh di file .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
exports.generateSaranRuteGemini = async (req, res) => {
  try {
    const { nama_tempat, kategori, jarak } = req.body || {};

    let daftarTempatDb = 'Jembatan & Kanal Kayutangan, Rumah Kolonial 1870, Kopi Lonceng, Calathea Garden Kafe';
    try {
      const [rows] = await db.query('SELECT nama_tempat FROM tempat_wisata LIMIT 8');
      if (rows.length > 0) {
        daftarTempatDb = rows.map(r => r.nama_tempat).join(', ');
      }
    } catch (_) {}

    const targetUtama = nama_tempat
      ? `User sedang memilih ikon lokasi "${nama_tempat}" (Kategori: ${kategori || 'Wisata'}, Jarak: ${jarak || '50m'}) di peta.`
      : `User berada di gang utama Kampoeng Heritage Kayutangan Malang.`;

    const promptText = `
Kamu adalah AI Tour Guide di Kampoeng Heritage Kayutangan, Malang.
${targetUtama}
Spot lain di sekitar Kayutangan: ${daftarTempatDb}.

Buatkan rekomendasi "Saran Langkah AI" yang terdiri dari TEPAT 3 langkah bernomor (1., 2., 3.).
Aturan:
- Langkah 1 WAJIB menuju "${nama_tempat || 'Jembatan & Kanal Kayutangan'}" (${jarak || '50m'}) beserta aktivitas singkat di sana.
- Langkah 2 menuju spot sejarah/foto terdekat dari daftar di atas.
- Langkah 3 bersantai di kafe/kuliner heritage terdekat.
- Singkat, padat (maksimal 1 kalimat per poin), tanpa tanda bintang markdown (**).
`.trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal memanggil Gemini API');
    }

    const hasilSaranAi = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      `1. ${nama_tempat || 'Jembatan & Kanal Kayutangan'} (${jarak || '50m'}) - Spot kunjungan utama pilihan Anda.\n2. Rumah Kolonial 1870 untuk wisata Sejarah.\n3. Santap sore di Calathea Garden Kafe atau Kopi Lonceng.`;

    res.status(200).json({
      success: true,
      nama_tempat_tujuan: nama_tempat || 'Jembatan dan Kanal Kayutangan',
      saran_langkah: hasilSaranAi
    });

  } catch (error) {
    console.error('Error Gemini:', error.message);
    const { nama_tempat, jarak } = req.body || {};
    res.status(200).json({
      success: true,
      nama_tempat_tujuan: nama_tempat || 'Jembatan dan Kanal Kayutangan',
      saran_langkah: `1. ${nama_tempat || 'Jembatan & Kanal Kayutangan'} (${jarak || '50m'}) - Spot kunjungan utama pilihan Anda.\n2. Rumah Kolonial 1870 untuk wisata Sejarah.\n3. Santap sore di Calathea Garden Kafe atau Kopi Lonceng.`
    });
  }
};