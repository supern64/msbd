/*
    handles connection packet
*/

import { type Socket } from "bun";
import { connect, ping } from "../protocol/response";
import { REQ_CONNECTION_FLAGS, RES_CONNECTION_FLAGS } from "../protocol/constants";
import { parsedArgs, type SocketData } from "..";
import { currentQueue, loadAndStartQueue, startQueue } from "./queue";

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
    
    if (parsedArgs.media) { // single media takes priority
        // add item to queue
        currentQueue.push({
            source: parsedArgs.media,
            flags: []
        })
        startQueue(socket)
    } else {
        // load playlist and add to queue
        loadAndStartQueue(socket, parsedArgs.playlist!)
    }

    /*
    this thing doesn't work for some reason so i'm not gonnna bother with it
    // schedule ping every 30 seconds
    socket.data.pingInterval = setInterval(() => {
        console.log("[msbd] pinging client")
        socket.write(ping())
        if (!socket.data.pingDue) {
            socket.data.pingDue = true
            socket.data.timeOut = setTimeout(() => {
                // client hasn't responded in 2 minutes
                console.log(`[msbd] client ${socket.remoteAddress} presumed timed out - disconnecting`)
                socket.end()
            }, 120000)
        }
    }, 30000)
    */
}