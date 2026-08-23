const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statik dosyaları public klasöründen sunuyoruz
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    // Kullanıcı ortak odaya katıldığında
    socket.on('join-room', (roomID) => {
        socket.join(roomID);
        console.log(`Kullanıcı ${roomID} odasına katıldı.`);
    });

    // M3U8 linki değiştirildiğinde diğerine bildir
    socket.on('change-source', ({ roomID, url }) => {
        socket.to(roomID).emit('remote-change-source', url);
    });

    // Video oynatıldığında
    socket.on('play-video', ({ roomID, currentTime }) => {
        socket.to(roomID).emit('remote-play', currentTime);
    });

    // Video durdurulduğunda
    socket.on('pause-video', ({ roomID, currentTime }) => {
        socket.to(roomID).emit('remote-pause', currentTime);
    });

    // Video ileri/geri sarıldığında
    socket.on('seek-video', ({ roomID, currentTime }) => {
        socket.to(roomID).emit('remote-seek', currentTime);
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
