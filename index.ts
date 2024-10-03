/*
    main file
*/

import { parsePacket } from "./protocol/parser";
import type { StreamInfo } from "./protocol/response";
import { parseArgs } from "util";
import { FFMPEG_FLAGS } from "./server/constants";

export const { values: parsedArgs } = parseArgs({
    options: {
        port: {
            type: "string",
            default: "7007",
            short: "p"
        },
        config: {
            type: "string",
            multiple: true,
            short: "c"
        },
        media: {
            type: "string",
            short: "m"
        }
    }
})

// init stream info
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

export interface SocketData {
    pingInterval?: Timer,
    timeOut?: Timer,
    pingDue: boolean,
    packetCount: number
}

if (!parsedArgs.port || !parsedArgs.config || !parsedArgs.media) {
    console.error("[server] missing config/media")
    help()
    process.exit(1)
}
if (!parsedArgs.config.every((r) => FFMPEG_FLAGS[r])) {
    console.error(`[server] invalid config, valid options are ${Object.keys(FFMPEG_FLAGS).join(", ")}`)
    process.exit(1)
}

function help() {
    console.log(
`
msbd - MSBD Protocol/Windows Media Encoder Emulator
Available flags:
    -p, --port              Port to use [default: 7007]
    -c, --config            FFMPEG flag presets to use (see below)
    -m, --media             The media to play (file/URL that ffmpeg can open)

Valid presets (check server/constants.ts):
` + 
Object.entries(FFMPEG_FLAGS).map((r) => `    ${r[0].padEnd(24, " ")}${r[1].description}`).join("\n")
)
}

Bun.listen<SocketData>({
    hostname: "0.0.0.0",
    port: parseInt(parsedArgs.port),
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

console.log(`[server] listening on port ${parsedArgs.port}`)