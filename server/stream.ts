/*
    handles streaming data
*/

import { type Socket } from "bun";
import type { Readable } from "stream";
import { currentStream, parsedArgs, type SocketData } from "..";
import { bunToNodeStream, DataType, readASF } from "../protocol/asf";
import { endOfStream, packet, simpleStreamInfo } from "../protocol/response";
import { Message } from "../protocol/constants";
import * as childProcess from "child_process";
import { FlagPosition, type Flag } from "./constants";

export async function streamASF(socket: Socket<SocketData>, stream: ReadableStream | Readable, useSendTime: boolean = false) {
    if (stream instanceof ReadableStream) stream = bunToNodeStream(stream)
    let dataObjectReceived = false, filePropertiesReceived = false, headerSent = false, lastSendTime = 0
    try {
        for await (const message of readASF(stream)) {
            /* @ts-ignore -- bun's types are shit -- */
            if (socket.readyState !== 1) return
            switch (message.type) {
                case DataType.DATA_OBJECT:
                    currentStream.header = message.withHeader
                    dataObjectReceived = true
                    break
                case DataType.FILE_PROPERTIES:
                    currentStream.maxPacketSize = message.maxPacketSize
                    currentStream.totalPackets = Number(message.packetCount)
                    currentStream.duration = Number(message.playDuration / BigInt(1000))
                    currentStream.bitRate = message.maxBitRate
                    filePropertiesReceived = true
                    break
                case DataType.DATA_PACKET:
                    const p = packet(
                        socket.data.packetCount++,
                        currentStream.streamId,
                        message.data
                    )
                    if (useSendTime) {
                        if (message.sendTime > lastSendTime) {
                            await Bun.sleep(message.sendTime - lastSendTime - 5)
                        }
                        lastSendTime = message.sendTime
                        socket.write(p)
                    } else {
                        socket.write(p)
                    }           
            }
            if (!headerSent && dataObjectReceived && filePropertiesReceived) {
                // data complete, time to send headerz
                headerSent = true
                console.log(`[msbd:stream] sending stream headers (MP: ${currentStream.maxPacketSize}, TP: ${currentStream.totalPackets}, D: ${currentStream.duration}, MBR: ${currentStream.bitRate})`)
                socket.write(simpleStreamInfo(Message.IND_STREAMINFO, 0, currentStream))
            }
        }
        socket.write(endOfStream())
    } catch (e) {
        console.error("[msbd:stream] error occured while streaming content")
        console.error(e)
        return
    }
}

export async function startStreamFromFile(socket: Socket<SocketData>, fileName: string) {
    try {
        const stream = Bun.file(fileName).stream()
        console.log(`[msbd:stream] streaming directly from ${fileName}`)
        await streamASF(socket, stream, true)
    } catch (e) {
        console.error(`[msbd:stream] error while reading file`)
        console.error(e)
    }
}

export async function startStreamFromFFMPEG(socket: Socket<SocketData>, src: string, flags: Flag[] = []) {
    // combined with global flags (global flags come first)
    const ffmpegFlags = [
        flags.filter((f) => {return f.position === FlagPosition.BEFORE_INPUT}).map((r) => r.flags).flat(),
        "-i", src,
        flags.filter((f) => {return f.position === FlagPosition.AFTER_INPUT}).map((r) => r.flags).flat(),
        "-f", "asf",
        "-"
    ].flat()
    console.log(`[msbd:stream] launching ffmpeg ${ffmpegFlags.join(" ")}`)
    const ffmpeg = childProcess.spawn(
        "ffmpeg",
        ffmpegFlags
    )
    ffmpeg.stderr.on("data", (d) => {
        Bun.write(Bun.stdout, d.toString())
    })
    await streamASF(socket, ffmpeg.stdout)
    ffmpeg.kill()
}