import { type Socket } from "bun";
import { connect, ping, simpleStreamInfo, streamInfo } from "../protocol/response";
import { Message, REQ_CONNECTION_FLAGS, RES_CONNECTION_FLAGS } from "../protocol/constants";
import { currentStream, type SocketData } from "..";
import { startStreamFromFFMPEG, startStreamFromFile } from "./stream";

export interface ConnectMessage {
    dwFlags: REQ_CONNECTION_FLAGS,
    szChannel: Uint8Array
}

export async function handleConnect(socket: Socket<SocketData>, content: ConnectMessage) {
    console.log(`[msbd:connect] ${socket.remoteAddress} connected`)

    if (content.dwFlags !== REQ_CONNECTION_FLAGS.SINGLE_CLIENT) {
        console.warn("[msbd:connect] multicast not implemented")
        socket.end(connect(0xC00D001A, 0, 0, 0, 0))
        return
    }

    socket.write(connect(0, RES_CONNECTION_FLAGS.ASF_NOT_IN_NSC, 0, 0, 0))
    console.log(`[msbd:connect] attempting to start stream`)
    
    //startStreamFromFile(socket, "stream_lq.asf")
    startStreamFromFFMPEG(socket, Bun.argv[2])

    // schedule ping every 30 seconds
    socket.data.pingInterval = setInterval(() => {
        socket.write(ping())
        if (!socket.data.pingDue) {
            socket.data.pingDue = true
            socket.data.timeOut = setTimeout(() => {
                // client hasn't responded in 2 minutes
                socket.end()
            }, 120000)
        }
    }, 30000)
}