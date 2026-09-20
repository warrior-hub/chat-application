import { io } from "socket.io-client";

const socket = io("https://chat-application-t21p.onrender.com", {
  autoConnect: false,
});

export default socket;
