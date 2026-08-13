const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

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

io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  // Yeni bağlananlara mevcut durumu bildir
  socket.emit('pinnedMessage', pinnedMessage);
  socket.emit('slowModeStatus', isSlowModeActive);

  // 1. Normal Mesaj Gönderimi
  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', {
      id: Date.now(),
      username: data.username.substring(0, 20),
      message: data.message.substring(0, 250),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // 2. Yavaş Modu Açma / Kapatma (Sadece Admin Tetikler)
  socket.on('toggleSlowMode', (status) => {
    isSlowModeActive = status;
    io.emit('slowModeStatus', isSlowModeActive); // Herkese bildir
  });

  // 3. Mesajı Sabitleme Olayı
  socket.on('pinMessage', (text) => {
    pinnedMessage = text;
    io.emit('pinnedMessage', pinnedMessage);
  });

  // 4. Sabitlenen Mesajı Kaldırma
  socket.on('unpinMessage', () => {
    pinnedMessage = null;
    io.emit('pinnedMessage', null);
  });

  // 5. Herkes İçin Mesaj Silme Olayı
  socket.on('deleteMessage', (msgId) => {
    io.emit('deleteMessage', msgId);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat sunucusu ${PORT} portunda çalışıyor.`);
});
