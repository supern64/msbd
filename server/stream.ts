import type { Socket } from "bun";
import type { Readable } from "stream";
import { currentStream, type SocketData } from "..";
import { bunToNodeStream, DataType, readASF } from "../protocol/asf";
import { emptyStreamInfo, endOfStream, packet, simpleStreamInfo } from "../protocol/response";
import { Message } from "../protocol/constants";
import * as childProcess from "child_process";

export async function streamASF(socket: Socket<SocketData>, stream: ReadableStream | Readable) {
    if (stream instanceof ReadableStream) stream = bunToNodeStream(stream)
    for await (const message of readASF(stream)) {
        /* @ts-ignore -- bun's types are shit -- */
        if (socket.readyState !== 1) return
        switch (message.type) {
            case DataType.DATA_OBJECT:
                currentStream.header = message.withHeader
                break
            case DataType.FILE_PROPERTIES:
                currentStream.maxPacketSize = message.maxPacketSize
                currentStream.totalPackets = Number(message.packetCount)
                currentStream.duration = Number(message.playDuration)
                currentStream.bitRate = message.maxBitRate
                console.log(currentStream)
                socket.write(simpleStreamInfo(Message.IND_STREAMINFO, 0, currentStream))
                break
            case DataType.DATA_PACKET:
                const p = packet(
                    socket.data.packetCount++,
                    currentStream.streamId,
                    message.data
                )
                socket.write(p)     
        }
    }
    socket.write(endOfStream())
    socket.write(emptyStreamInfo(Message.IND_STREAMINFO, 0xC00D0033)) // no double stream support yet, sorry!
}

export async function startStreamFromFile(socket: Socket<SocketData>, fileName: string) {
    await streamASF(socket, Bun.file(fileName).stream())
}

export async function startStreamFromFFMPEG(socket: Socket<SocketData>, src: string) {
    const ffmpeg = childProcess.spawn(
        "ffmpeg",
        [
            "-re",
            "-i",
            src,
            "-f",
            "asf",
            "-"
        ]
    )
    
    await streamASF(socket, ffmpeg.stdout)
}