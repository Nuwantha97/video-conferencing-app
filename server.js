const express = require("express");
const app = express();
const server = require("http").createServer(app);
const { v4: uuidV4 } = require("uuid");
const io = require("socket.io")(server);

const PORT = process.env.PORT || 3000;

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.use("/peerjs", peerServer);
app.set("view engine", "ejs");
app.use(express.static("public"));

/*
app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});
*/

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/room', (req, res) => {
    const roomId = uuidV4();
    res.redirect(`/room/${roomId}`);
});

app.get('/join', (req, res) => {
    const roomId = req.query.roomId;
    res.redirect(`/room/${roomId}`);
});

app.get('/room/:room', (req, res) => {
    res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    //console.log("nw");
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);

        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message);
        });

        socket.on("disconnect", function () {
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });
});

//server.listen(process.env.PORT || 3000);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});