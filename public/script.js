const socket = io('/', {
    transports: ['websocket'],
    secure: true,
    reconnection: true,
    rejectUnauthorized: false,
    reconnectionAttempts: 10
});
const chatInputBox = document.getElementById("chat__message");
const all_messages = document.getElementById("all__messages");
const leave_meeting = document.getElementById("leave-meeting");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

var peer = new Peer(undefined, {
    host: 'video-conferencing-app-ehdw.vercel.app', // Change this based on your deployment
    secure: true, // Important for HTTPS
    port: '443', // Standard HTTPS port
    path: '/peerjs',
    config: {
        'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            // Add TURN servers for better connectivity
            {
                urls: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            }
        ]
    },
    debug: 3
});

let myVideoStream;
let currentUserId;
let pendingMsg = 0;
let peers = {};
var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
}).then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, "me");

    peer.on("call", (call) => {
        call.answer(stream);
        const video = document.createElement("video");
        
        call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream);
            console.log(peers);
        });
    });


    socket.on("user-connected", (userId) => {
        connectToNewUser(userId, stream);
    });

    socket.on("user-disconnected", (userId) => {
        if (peers[userId]) peers[userId].close();
        speakText(`user ${userId} left`);
    });

    document.addEventListener("keydown", (e) => {
        if (e.which === 13 && chatInputBox.value != "") {
            socket.emit("message", {
                msg: chatInputBox.value,
                user: currentUserId,
            });
            chatInputBox.value = "";
        }
    });

    document.getElementById("sendMsg").addEventListener("click", (e) => {
        if (chatInputBox.value != "") {
            socket.emit("message", {
                msg: chatInputBox.value,
                user: currentUserId,
            });
            chatInputBox.value = "";
        }
    });

    chatInputBox.addEventListener("focus", () => {
        document.getElementById("chat__Btn").classList.remove("has__new");
        pendingMsg = 0;
        document.getElementById("chat__Btn").children[1].innerHTML = `Chat`;
    });

    socket.on("createMessage", (message) => {
        console.log(message);
        let li = document.createElement("li");
        if (message.user != currentUserId) {
            li.classList.add("otherUser");
            li.innerHTML = `<div><b>User (<small>${message.user}</small>): </b>${message.msg}</div>`;
        } else {
            li.innerHTML = `<div><b>You: </b>${message.msg}</div>`;
        }

        all_messages.append(li);
        main__chat__window.scrollTop = main__chat__window.scrollHeight;
        if(message.user != currentUserId){
            pendingMsg++;
            playChatSound();
            document.getElementById("chat__Btn").classList.add("has__new");
            document.getElementById(
                "chat__Btn"
            ).children[1].innerHTML = `Chat (${pendingMsg})`;
        }
    });

});

peer.on("call", function (call) {
    getUserMedia({ video: true, audio: true }, function (stream) {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", function (remoteStream) {
            addVideoStream(video, remoteStream);
        });
    },
    function (err) {
        console.log("Failed to get local stream", err);
    }
);
});

peer.on("open", (id) => {
    currentUserId = id;
    socket.emit("join-room", ROOM_ID, id);
});

socket.on("disconnect", function () {
    socket.emit("leave-room", ROOM_ID, currentUserId);
});

//CHAT
const connectToNewUser = (userId, stream) => {
    var call = peer.call(userId, stream);
    console.log(call);
    var video = document.createElement("video");

    call.on("stream", (userVideoStream) => {
        console.log(userVideoStream);
        addVideoStream(video, userVideoStream, userId);
    });

    call.on("close", () => {
        video.remove();
    });

    peers[userId] = call;
};

const setPlayVideo = () => {
    const html = `<i class="fa fa-video-camera-slash"></i>
    <span>Play Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
    const html = `<i class="fa fa-video-camera"></i>
    <span>Stop Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setMuteButton = () => {
    const html = `<i class="fa fa-microphone"></i>
    <span>Mute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const setUnmuteButton = () => {
    const html = `<i class="fa fa-microphone-slash"></i>
    <span>Unmute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const addVideoStream = (video, stream, user) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });

    videoGrid.append(video);
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width =
            100 / totalUsers + "%";
        }
    }
};


const ShowChat = (e) => {
    e.classList.toggle("active");
    document.body.classList.toggle("ShowChat");
}
const showInvitePopuop = () => {
    document.body.classList.add("ShowInvite");
    document.getElementById("roomLink").value = window.location.href;
};

const hideInvitePopuop = () => {
    document.body.classList.remove("ShowInvite");
};

const copyToClipboard = () => {
    var copyText = document.getElementById("roomLink");

    copyText.select();
    copyText.setSelectionRange(0, 99999);

    document.execCommand("copy");

    alert("Copied: " + copyText.value);

    hideInvitePopuop();
};

const playChatSound = () => {
    const chatAudio = document.getElementById("chatAudio");
    chatAudio.play();
}

const speakText = (msgTxt) => {
    var msg = new SpeechSynthesisUtterance();
    msg.text = msgTxt;
    window.speechSynthesis.speak(msg);
};