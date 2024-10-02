import type { Socket } from "bun";
import type { SocketData } from "..";

export function handlePing(socket: Socket<SocketData>) {
    // console.log(`[msbd:ping] ${socket.remoteAddress} responded`)
    socket.data.pingDue = false;
    clearTimeout(socket.data.timeOut)
}