/*
    basic queue system, don't expect much
*/

import type { Socket } from "bun"
import { getPlaylistFromFile, type PlaylistEntry } from "../util/playlist"
import { startStreamFromFFMPEG, startStreamFromFile } from "./stream"
import { currentStream, parsedArgs, type SocketData } from ".."
import { emptyStreamInfo } from "../protocol/response"
import { Message } from "../protocol/constants"
import { FLAGS } from "./constants"

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
        nextItem.flags = [...new Set((parsedArgs.config as string[]).map((r) => FLAGS[r]).concat(nextItem.flags))]
        if (nextItem.flags.includes(FLAGS.direct)) {
            if (!nextItem.source.endsWith(".asf")) {
                console.warn(`[msbd:queue] queued a stream with non .asf file extension for direct playback. this is probably bad.`)
            }
            await startStreamFromFile(socket, nextItem.source)
        } else {
            await startStreamFromFFMPEG(socket, nextItem.source, nextItem.flags)
        }
        currentStream.streamId++
        // from MSBD 2.2.6
        if (currentStream.streamId > 0x07FF) {
            currentStream.streamId = 0x8000
        } else if (currentStream.streamId > 0x87FF) {
            currentStream.streamId = 0
        }
        await startQueue(socket)
    } else {
        currentStream.streamId = 0
        socket.write(emptyStreamInfo(Message.IND_STREAMINFO, 0xC00D0033))
        console.log("[msbd:queue] queue has ended")
    }
}