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

io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', {
      username: data.username.substring(0, 20),
      message: data.message.substring(0, 250),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat sunucusu ${PORT} portunda çalışıyor.`);
});
