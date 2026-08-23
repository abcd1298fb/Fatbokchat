const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path'); // path modülünü ekledik

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

// Statik dosyaları public klasöründen mutlak yol ile sunuyoruz
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    socket.on('join-room', (roomID) => {
        socket.join(roomID);
        console.log(`Kullanıcı ${roomID} odasına katıldı.`);
    });

    socket.on('change-source', ({ roomID, url }) => {
        socket.to(roomID).emit('remote-change-source', url);
    });

    socket.on('play-video', ({ roomID, currentTime }) => {
        socket.to(roomID).emit('remote-play', currentTime);
    });

    socket.on('pause-video', ({ roomID, currentTime }) => {
        socket.to(roomID).emit('remote-pause', currentTime);
    });

    socket.on('seek-video', ({ roomID, currentTime }) => {
        socket.to(roomID).emit('remote-seek', currentTime);
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
    });
}

module.exports = server;
