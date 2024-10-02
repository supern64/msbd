import { type Socket } from "bun";
import { simpleStreamInfo } from "../protocol/response";
import { Message } from "../protocol/constants";
import { currentStream, type SocketData } from "..";


export function handleStreamInfo(socket: Socket<SocketData>) {
    console.log(`[msbd:streamInfo] ${socket.remoteAddress} requested stream info`)

    socket.write(simpleStreamInfo(Message.RES_STREAMINFO, 0, currentStream))
}