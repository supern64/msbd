/*
    handles streaming data
*/

import type { Socket } from "bun";
import type { Readable } from "stream";
import { currentStream, parsedArgs, type SocketData } from "..";
import { bunToNodeStream, DataType, readASF } from "../protocol/asf";
import { endOfStream, packet, simpleStreamInfo } from "../protocol/response";
import { Message } from "../protocol/constants";
import * as childProcess from "child_process";
import { FFMPEG_FLAGS, FlagPosition, type Flag } from "./constants";

export async function streamASF(socket: Socket<SocketData>, stream: ReadableStream | Readable, useSendTime: boolean = false) {
    if (stream instanceof ReadableStream) stream = bunToNodeStream(stream)
    let dataObjectReceived = false, filePropertiesReceived = false, headerSent = false, lastSendTime = 0
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
                currentStream.duration = Number(message.playDuration)
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
                        await Bun.sleep(message.sendTime - lastSendTime - 100) // send it early (a bit)
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
            console.log("[msbd:stream] sending stream headers")
            socket.write(simpleStreamInfo(Message.IND_STREAMINFO, 0, currentStream))
        }
    }
    socket.write(endOfStream())
}

export async function startStreamFromFile(socket: Socket<SocketData>, fileName: string) {
    await streamASF(socket, Bun.file(fileName).stream(), true)
}

export async function startStreamFromFFMPEG(socket: Socket<SocketData>, src: string, flags: Flag[] = []) {
    // combined with global flags (global flags come first)
    flags = [...new Set((parsedArgs.config as string[]).map((r) => FFMPEG_FLAGS[r]).concat(flags))]
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