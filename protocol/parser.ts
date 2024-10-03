/*
    decodes incoming MSBD packets
*/

import type { Socket } from "bun";
import { DW_SIGNATURE, Message, REQ_CONNECTION_FLAGS } from "./constants";
import { handleConnect } from "../server/connect";
import { handleStreamInfo } from "../server/streamInfo";
import type { SocketData } from "..";
import { handlePing } from "../server/ping";

// fuck you im too lazy to rewrite in tokenizer

export interface Header {
//  dwSignature: number,
//  wVersion: number,
    wMessageId: Message,
    cbMessage: number,
    hr: number
}

export interface ConnectMessage {
    dwFlags: REQ_CONNECTION_FLAGS,
    szChannel: Uint8Array
}

// parse initial packet and send off to appropriate handlers
export function parsePacket(socket: Socket<SocketData>, data: Uint8Array) {
    const header = readHeader(data)
    if (header.hr !== 0) console.warn("[msbd] client sent non-zero error code")
    const body = data.slice(16)

    switch (header.wMessageId) {
        case Message.REQ_CONNECT:
            const content = readConnectionPacket(header, body)
            handleConnect(socket, content)
            break
        case Message.REQ_STREAMINFO:
            handleStreamInfo(socket)
            break
        case Message.RES_PING:
            handlePing(socket)
            break
        default:
            console.warn("[msbd] client send invalid message id: ignoring")
    }
}

// data parsing logic
export function readHeader(data: Uint8Array): Header {
    const view = new DataView(data.buffer);
    if (view.getUint32(0, true) !== DW_SIGNATURE) {
        throw new Error("[msbd] invalid signature")
    }
    // wVersion = view.getInt16(4, true)
    const wMessageId = view.getUint16(6, true)
    const cbMessage = view.getUint32(8, true)
    const hr = view.getUint32(12, true)

    // bound check (Uint32 can't get above 0xFFFF in the first place)
    if (cbMessage <= 0x0010) {
        throw Error("[msbd] invalid packet size")
    }

    return {
        wMessageId,
        cbMessage,
        hr
    }
}

export function readConnectionPacket(header: Header, data: Uint8Array): ConnectMessage {
    const view = new DataView(data.buffer)
    const dwFlags = view.getUint32(0, true)
    const szChannel = data.slice(4, header.cbMessage - 16)

    return {
        dwFlags,
        szChannel
    }
}