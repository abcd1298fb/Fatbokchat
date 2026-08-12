const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Tarayıcıdan linke girildiğinde hata vermemesi için
app.get('/', (req, res) => {
  res.send('FATBOK Chat Sunucusu Aktif ve Çalışıyor!');
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Sabitlenen mesajı hafızada tutmak için değişken
let pinnedMessage = null;

io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  // 1. Normal Mesaj Gönderimi
  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', {
      id: Date.now(), // Mesajları silmek için benzersiz bir ID ekledik
      username: data.username.substring(0, 20),
      message: data.message.substring(0, 250),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // 2. Mesajı Sabitleme Olayı
  socket.on('pinMessage', (text) => {
    pinnedMessage = text;
    io.emit('pinnedMessage', pinnedMessage); // Herkese sabitlenen mesajı ilet
  });

  // 3. Mesajı Sabitlemeden Kaldırma Olayı
  socket.on('unpinMessage', () => {
    pinnedMessage = null;
    io.emit('pinnedMessage', null); // Herkese sabitlemenin kalktığını bildir
  });

  // 4. Yeni bağlanan kullanıcıya sabitli mesajı gönder
  socket.on('requestPinnedMessage', () => {
    if (pinnedMessage) {
      socket.emit('pinnedMessage', pinnedMessage);
    }
  });

  // 5. Herkes İçin Mesaj Silme Olayı
  socket.on('deleteMessage', (msgId) => {
    io.emit('deleteMessage', msgId); // Belirli ID'li mesajı silmeleri için sinyal gönder
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat sunucusu ${PORT} portunda çalışıyor.`);
});
