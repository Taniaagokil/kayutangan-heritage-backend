// 1. Daftar Rekomendasi Pertanyaan (untuk ditampilkan sebagai tombol/chips di Flutter)
exports.getTemplates = (req, res) => {
  const templates = [
    {
      id: 1,
      category: "Rute & Spot Foto",
      question: "Rekomendasi spot foto vintage terbaik di sore hari?",
      has_route: true
    },
    {
      id: 2,
      category: "Rute Kuliner",
      question: "Di mana lokasi kuliner & kafe legendaris terdekat?",
      has_route: true
    },
    {
      id: 3,
      category: "Rute Jalan Santai",
      question: "Pandu saya rute jalan santai dari pintu masuk utama",
      has_route: true
    },
    {
      id: 4,
      category: "Sejarah",
      question: "Ceritakan sejarah singkat Kolonial Kayutangan",
      has_route: false
    },
    {
      id: 5,
      category: "Info Kunjungan",
      question: "Jam berapa waktu terbaik berkunjung dan bagaimana aturan tiketnya?",
      has_route: false
    },
    {
      id: 6,
      category: "Fasilitas",
      question: "Di mana lokasi musholla dan toilet umum terdekat?",
      has_route: true
    }
  ];

  res.json({ success: true, data: templates });
};

// 2. Proses Pertanyaan User & Simpan ke Database (`ai_chat_sessions` & `ai_chat_messages`)
exports.askAi = (req, res) => {
  const { user_id, question } = req.body;

  if (!user_id || !question) {
    return res.status(400).json({ success: false, message: 'user_id dan question wajib diisi.' });
  }

  global.db.query('INSERT INTO ai_chat_sessions (user_id) VALUES (?)', [user_id], (err, sessionRes) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const sessionId = sessionRes.insertId;

    const q = question.toLowerCase();
    let aiResponse = '';
    let recommendedRoute = [];

    if (q.includes('spot foto') || q.includes('vintage')) {
      aiResponse = 'Berikut rute spot foto vintage terbaik di sore hari (cahaya golden hour sekitar pukul 15.30–17.00):\n1. Jembatan & Kanal Kayutangan (Spot foto ikonik tepi sungai)\n2. Spot Sepeda Ontel & Kursi Antik\n3. Sudut Bunga Bougenville & Rumah Kolonial 1870.';
      recommendedRoute = [
        { name: 'Jembatan & Kanal Kayutangan', lat: -7.9818, lng: 112.6305 },
        { name: 'Spot Sepeda Ontel', lat: -7.9821, lng: 112.6309 },
        { name: 'Rumah Kolonial 1870', lat: -7.9819, lng: 112.6307 }
      ];
    } else if (q.includes('kuliner') || q.includes('kafe') || q.includes('makan')) {
      aiResponse = 'Rekomendasi kuliner & kafe legendaris di dalam gang heritage:\n1. Kopi Lonceng (Kopi klasik suasana tempo doeloe)\n2. Calathea Garden Kafe (Cocok untuk santap sore & istirahat)\n3. Warung Kuliner Khas Malang.';
      recommendedRoute = [
        { name: 'Kopi Lonceng', lat: -7.9815, lng: 112.6302 },
        { name: 'Calathea Garden Kafe', lat: -7.9823, lng: 112.6310 }
      ];
    } else if (q.includes('rute') || q.includes('pintu masuk') || q.includes('jalan santai')) {
      aiResponse = 'AI mendeteksi lokasi Anda di area pintu masuk utama. Ikuti rute jalan santai berurutan berikut agar tidak terlewat spot utamanya:\n1. Jembatan & Kanal Kayutangan\n2. Rumah Kolonial 1870\n3. Istirahat di Calathea Garden Kafe.';
      recommendedRoute = [
        { name: 'Jembatan & Kanal Kayutangan', lat: -7.9818, lng: 112.6305 },
        { name: 'Rumah Kolonial 1870', lat: -7.9819, lng: 112.6307 },
        { name: 'Calathea Garden Kafe', lat: -7.9823, lng: 112.6310 }
      ];
    } else if (q.includes('musholla') || q.includes('toilet') || q.includes('masjid') || q.includes('fasilitas')) {
      aiResponse = 'Fasilitas ibadah dan toilet umum tersedia di area tengah gang heritage dekat Masjid Jami’ sekitar kawasan Kayutangan. Ikuti penanda rute berikut untuk menuju titik fasilitas terdekat.';
      recommendedRoute = [
        { name: 'Area Fasilitas Umum & Musholla Kayutangan', lat: -7.9820, lng: 112.6308 }
      ];
    } else if (q.includes('sejarah') || q.includes('kolonial')) {
      aiResponse = 'Kampoeng Heritage Kayutangan adalah kawasan permukiman bersejarah di jantung Kota Malang yang berkembang sejak era kolonial Belanda (abad ke-19). Kawasan ini mempertahankan arsitektur asli rumah Belanda, gaya Jengki tahun 1950-an, serta tata ruang gang sempit khas kampung lama Malang.';
      // Kosong karena pertanyaan informasi sejarah (tidak perlu gambar garis rute di peta)
      recommendedRoute = [];
    } else if (q.includes('jam') || q.includes('tiket') || q.includes('aturan')) {
      aiResponse = 'Kampoeng Heritage Kayutangan buka setiap hari pukul 07.00 – 22.00 WIB. Waktu terbaik berkunjung adalah pagi hari (07.30–10.00) atau sore hari (15.30–18.00). Tiket masuk berlaku untuk 1x kunjungan (Rp5.000 wisatawan lokal, Rp10.000 wisatawan mancanegara) dan wajib di-scan petugas di pintu masuk.';
      recommendedRoute = [];
    } else {
      aiResponse = 'Halo! Saya AI Tour Guide Kayutangan Heritage. Anda bisa menanyakan sejarah bangunan kolonial, rekomendasi kuliner, jam operasional, atau meminta panduan rute spot foto terbaik di sekitar Anda.';
      recommendedRoute = [];
    }

    // Simpan percakapan ke tabel ai_chat_messages (kolom: session_id, role, content)
    const insertMsg = "INSERT INTO ai_chat_messages (session_id, role, content) VALUES (?, 'user', ?), (?, 'assistant', ?)";
    global.db.query(insertMsg, [sessionId, question, sessionId, aiResponse], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      res.json({
        success: true,
        session_id: sessionId,
        reply: aiResponse,
        has_route: recommendedRoute.length > 0,
        route_waypoints: recommendedRoute
      });
    });
  });
};