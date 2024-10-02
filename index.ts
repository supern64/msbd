import { parsePacket } from "./protocol/parser";
import type { StreamInfo } from "./protocol/response";

export let currentStream: StreamInfo = {
    streamId: 3,
    maxPacketSize: 0xFFFD,
    totalPackets: 0,
    bitRate: 0xFFFD,
    duration: 0xFFFFFFFF,
    title: "test",
    description: "test",
    header: new Uint8Array(),
    link: "msbd://192.168.1.2"
}

export const clientList: number[] = []

export interface SocketData {
    pingInterval?: Timer,
    timeOut?: Timer,
    pingDue: boolean,
    packetCount: number
}

Bun.listen<SocketData>({
    hostname: "0.0.0.0",
    port: 7007,
    socket: {
        data(socket, data) {
            parsePacket(socket, new Uint8Array(data))
        },
        open(socket) {
            console.log(`[tcp] client ${socket.remoteAddress} connected`)
            socket.data = {
                pingInterval: undefined,
                pingDue: false,
                timeOut: undefined,
                packetCount: 0
            }
        },
        close(socket) {
            clearInterval(socket.data.pingInterval)
            console.log(`[tcp] client ${socket.remoteAddress} disconnected`)
        },
        drain(socket) {},
        error(socket, error) {
            console.error(error)
        }
    }
})

console.log("server listening on port 7007")