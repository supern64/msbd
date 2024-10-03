/*
    generates outbound MSBD packets
*/

import { RES_CONNECTION_FLAGS, DW_SIGNATURE, Message, SIN_FAMILY, W_VERSION } from "./constants";

export interface StreamInfo {
    streamId: number,
    maxPacketSize: number,
    totalPackets: number,
    bitRate: number,
    duration: number,
    title: string,
    description: string,
    header: Uint8Array,
    link: string
}

export interface StreamInfoWire {
    wStreamId: number,
    cbPacketSize: number,
    cTotalPackets: number,
    dwBitRate: number,
    msDuration: number,
    cbTitle: number,
    cbDescription: number,
    cbLink: number,
    cbHeader: number,
    bBinaryData: Uint8Array
}

export function concat(...byte: Uint8Array[]): Uint8Array {
    const mergedArray = new Uint8Array(byte.map((r) => r.length).reduce((p, c) => { return p + c }))
    let ptr = 0;
    for (const array of byte) {
        mergedArray.set(array, ptr)
        ptr += array.length
    }
    return mergedArray
}

export function ping() {
    return header(Message.REQ_PING, 16, 0)
}

export function header(
    wMessageId: Message,
    cbMessage: number,
    hr: number
): Uint8Array {
    const buffer = new ArrayBuffer(16)
    const view = new DataView(buffer)

    view.setUint32(0, DW_SIGNATURE, true)
    view.setUint16(4, W_VERSION, true)
    view.setUint16(6, wMessageId, true)
    view.setUint32(8, cbMessage, true)
    view.setUint32(12, hr, true)

    return new Uint8Array(buffer)
}

export function simpleStreamInfo(
    wMessageId: Message.RES_STREAMINFO | Message.IND_STREAMINFO,
    hr: number,
    info: StreamInfo
): Uint8Array {
    const text = new TextEncoder()
    const binary = concat(text.encode(info.title), text.encode(info.description), text.encode(info.link), info.header)
    return streamInfo(wMessageId, hr, {
        wStreamId: info.streamId,
        cbPacketSize: info.maxPacketSize,
        cTotalPackets: info.totalPackets,
        dwBitRate: info.bitRate,
        msDuration: info.duration,
        cbTitle: info.title.length,
        cbDescription: info.description.length,
        cbHeader: info.header.length,
        cbLink: info.link.length,
        bBinaryData: binary
    })
}

export function emptyStreamInfo(
    wMessageId: Message.RES_STREAMINFO | Message.IND_STREAMINFO,
    hr: number
): Uint8Array {
    return concat(
        header(wMessageId, 16 + 32, hr),
        new Uint8Array(32)
    )
}

export function streamInfo(
    wMessageId: Message.RES_STREAMINFO | Message.IND_STREAMINFO,
    hr: number,
    info: StreamInfoWire
): Uint8Array {
    const buffer = new ArrayBuffer(32)
    const view = new DataView(buffer)

    view.setUint16(0, info.wStreamId, true)
    view.setUint16(2, info.cbPacketSize, true)
    view.setUint32(4, info.cTotalPackets, true)
    view.setUint32(8, info.dwBitRate, true)
    view.setUint32(12, info.msDuration, true)
    view.setUint32(16, info.cbTitle, true)
    view.setUint32(20, info.cbDescription, true)
    view.setUint32(24, info.cbLink, true)
    view.setUint32(28, info.cbHeader, true)
    
    const data = concat(
        header(wMessageId, 16 + (32 + info.bBinaryData.length), hr),
        new Uint8Array(buffer),
        info.bBinaryData
    )
    return data
}

export function connect(
    hr: number,
    dwFlags: RES_CONNECTION_FLAGS,
    sin_family: SIN_FAMILY,
    sin_port: number,
    sin_addr: number
): Uint8Array {
    const buffer = new ArrayBuffer(20)
    const view = new DataView(buffer)

    view.setUint32(0, dwFlags, true)
    view.setUint16(4, sin_family, true)
    view.setUint16(6, sin_port, false)
    view.setUint32(8, sin_addr, false)
    /* sin_zero for 8 bytes */

    return concat(
        header(Message.RES_CONNECT, 16 + 20, hr),
        new Uint8Array(buffer)
    )
}

export function endOfStream() {
    return header(Message.IND_EOS, 16, 0) // will i have to change this?
}

export function packet(
    dwPacketId: number,
    wStreamId: number,
    bPayload: Uint8Array
): Uint8Array {
    const buffer = new ArrayBuffer(8)
    const view = new DataView(buffer)

    view.setUint32(0, dwPacketId, true)
    view.setUint16(4, wStreamId, true)
    view.setUint16(6, 8 + bPayload.length, true)

    return concat(
        header(Message.IND_PACKET, 16 + (8 + bPayload.length), 0),
        new Uint8Array(buffer),
        bPayload
    )
}