var io = require('socket.io')({
    cors: {
        origin: "*"
    }
});

module.exports = io;