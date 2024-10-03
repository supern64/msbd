/*
    basic queue system, don't expect much
*/

import type { Socket } from "bun"
import { getPlaylistFromFile, type PlaylistEntry } from "../util/playlist"
import { startStreamFromFFMPEG } from "./stream"
import type { SocketData } from ".."
import { emptyStreamInfo } from "../protocol/response"
import { Message } from "../protocol/constants"

export const currentQueue: PlaylistEntry[] = []

export async function loadAndStartQueue(socket: Socket<SocketData>, path: string) {
    const playlist = await getPlaylistFromFile(path)
    console.log(`[msbd:queue] enqueuing ${playlist.length} items`)
    playlist.forEach((e) => currentQueue.push(e))
    startQueue(socket)
}

export async function startQueue(socket: Socket<SocketData>) {
    const nextItem = currentQueue.shift()
    /* @ts-ignore -- bun's types are shit -- */
    if (socket.readyState !== 1) {
        // clear queue if server disconnects
        currentQueue.length = 0
        return
    }
    if (nextItem) {
        console.log(`[msbd:queue] playing ${nextItem.source}`)
        await startStreamFromFFMPEG(socket, nextItem.source, nextItem.flags)
        await startQueue(socket)
    }
    socket.write(emptyStreamInfo(Message.IND_STREAMINFO, 0xC00D0033))
    console.log("[msbd:queue] queue has ended")
}