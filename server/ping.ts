/*
    handles ping (currently bugged)
*/

import type { Socket } from "bun";
import type { SocketData } from "..";

export function handlePing(socket: Socket<SocketData>) {
    socket.data.pingDue = false;
    clearTimeout(socket.data.timeOut)
}