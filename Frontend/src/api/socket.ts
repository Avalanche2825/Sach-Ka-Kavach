import { io } from "socket.io-client";
const SOCKET_URL = window.location.hostname === "localhost" ? "http://localhost:4000" : "/";
export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"]
});
