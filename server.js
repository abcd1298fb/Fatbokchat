const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Admin şifresi artık sadece sunucuda ve güvenli bir şekilde yer alıyor
const ADMIN_SECRET_PASS = "fatbok2026";

app.get('/', (req, res) => {
  res.send('FATBOK Chat Sunucusu Aktif ve Çalışıyor!');
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let pinnedMessage = null;
let isSlowModeActive = false; // Yavaş mod durumu (Varsayılan kapalı)

// --- Admin Dashboard & İstatistik Değişkenleri ---
let activeUsersCount = 0;
const recentLogs = [];

function addLog(message) {
  const logEntry = { 
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
    message 
  };
  recentLogs.unshift(logEntry); // En yeni log başa eklenir
  if (recentLogs.length > 50) recentLogs.pop(); // Bellekte en fazla son 50 log tutulur
}
// ----------------------------------------------

io.on('connection', (socket) => {
  activeUsersCount++;
  console.log('Bir kullanıcı bağlandı:', socket.id, `(Aktif: ${activeUsersCount})`);
  addLog(`Kullanıcı bağlandı (${socket.id.substring(0, 6)}...)`);

  // Yeni bağlananlara mevcut durumu bildir
  socket.emit('pinnedMessage', pinnedMessage);
  socket.emit('slowModeStatus', isSlowModeActive);
  
  // Tüm kullanıcılara/adminlere güncel aktif kullanıcı sayısını ve logları bildir
  io.emit('statsUpdate', { activeUsersCount, recentLogs });

  // Admin Giriş Doğrulama Olayı
  socket.on('verifyAdmin', (enteredPass, callback) => {
    if (enteredPass === ADMIN_SECRET_PASS) {
      addLog(`Admin girişi başarılı (${socket.id.substring(0, 6)}...)`);
      callback({ success: true, stats: { activeUsersCount, recentLogs } });
    } else {
      addLog(`Başarısız admin giriş denemesi (${socket.id.substring(0, 6)}...)`);
      callback({ success: false });
    }
  });

  // Admin panelinin anlık veri çekmesi için olay
  socket.on('getAdminStats', () => {
    socket.emit('adminStatsData', { activeUsersCount, recentLogs });
  });

  // 1. Normal Mesaj Gönderimi
  socket.on('chatMessage', (data) => {
    const username = data.username.substring(0, 20);
    const message = data.message.substring(0, 250);

    addLog(`[Mesaj] ${username}: ${message.substring(0, 25)}...`);

    io.emit('chatMessage', {
      id: Date.now(),
      username,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // 2. Yavaş Modu Açma / Kapatma (Sadece Admin Tetikler)
  socket.on('toggleSlowMode', (status) => {
    isSlowModeActive = status;
    addLog(`Yavaş mod ${status ? 'açıldı' : 'kapatıldı'}.`);
    io.emit('slowModeStatus', isSlowModeActive); // Herkese bildir
  });

  // 3. Mesajı Sabitleme Olayı
  socket.on('pinMessage', (text) => {
    pinnedMessage = text;
    addLog(`Bir mesaj sabitlendi.`);
    io.emit('pinnedMessage', pinnedMessage);
  });

  // 4. Sabitlenen Mesajı Kaldırma
  socket.on('unpinMessage', () => {
    pinnedMessage = null;
    addLog(`Sabitlenen mesaj kaldırıldı.`);
    io.emit('pinnedMessage', null);
  });

  // 5. Herkes İçin Mesaj Silme Olayı
  socket.on('deleteMessage', (msgId) => {
    addLog(`Bir mesaj silindi (ID: ${msgId}).`);
    io.emit('deleteMessage', msgId);
  });

  socket.on('disconnect', () => {
    activeUsersCount--;
    console.log('Kullanıcı ayrıldı:', socket.id, `(Aktif: ${activeUsersCount})`);
    addLog(`Kullanıcı ayrıldı (${socket.id.substring(0, 6)}...)`);
    
    // Ayrılma sonrasında sayaçları güncelle
    io.emit('statsUpdate', { activeUsersCount, recentLogs });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat sunucusu ${PORT} portunda çalışıyor.`);
});
