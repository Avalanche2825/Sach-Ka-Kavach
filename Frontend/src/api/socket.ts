import { io } from "socket.io-client";
const SOCKET_URL = window.location.hostname === "localhost" ? "http://localhost:4000" : "https://sach-ka-kavach.onrender.com";
export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"]
});
