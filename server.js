const express = require("express");
const app = express();
const server = require("http").createServer(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const path = require("path");

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.use("/peerjs", peerServer);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});