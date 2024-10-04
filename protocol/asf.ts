import * as strtok3 from "strtok3";
import * as Token from "token-types";
import { Readable, Transform } from "stream";
import { EndOfStreamError, StreamReader } from "peek-readable";
import { concat } from "../util/encoding";

/*
    this is a terribly written ASF reader,
    absolutely do NOT heed by my example
*/

// GUID token
const GUID: strtok3.IToken<string> = {
    len: 16,
    get: (buf, off) => {
        const dv = new DataView(buf.buffer, buf.byteOffset)
        return (
            dv.getUint32(off    , true).toString(16).padStart(8, '0')   + "-" +
            dv.getUint16(off + 4, true).toString(16).padStart(4, '0')   + "-" +
            dv.getUint16(off + 6, true).toString(16).padStart(4, '0')   + "-" +
            dv.getUint16(off + 8, false).toString(16).padStart(4, '0')  + "-" +
            dv.getUint32(off + 10, false).toString(16).padStart(8, '0') +
            dv.getUint16(off + 14, false).toString(16).padStart(4, '0')
        ).toUpperCase()
    },
    put: (buf, off, val) => {
        const dv = new DataView(buf.buffer, buf.byteOffset)
        const split = val.split("-")
        dv.setUint32(off, parseInt(split[0], 16), true)
        dv.setUint16(off + 4, parseInt(split[1], 16), true)
        dv.setUint16(off + 6, parseInt(split[2], 16), true)
        dv.setUint16(off + 8, parseInt(split[3], 16), false)
        dv.setUint32(off + 10, parseInt(split[4].slice(0, 8)), false)
        dv.setUint16(off + 14, parseInt(split[4].slice(8, 12)), false)
        return off + 16
    }
}

// type and enum declarations
export enum DataType {
    HEADER = "75B22630-668E-11CF-A6D9-00AA0062CE6C",
    FILE_PROPERTIES = "8CABDCA1-A947-11CF-8EE4-00C00C205365",
    DATA_OBJECT = "75B22636-668E-11CF-A6D9-00AA0062CE6C",
    DATA_PACKET = "DATA-PACKET" // arbitrary type
}

export const HEADER_LENGTH_MAP = [0, 1, 2, 4]

export interface HeaderData {
    type: DataType.HEADER,
    data: Uint8Array
}

export interface FileInfoData {
    type: DataType.FILE_PROPERTIES,
    flags: {broadcast: boolean, seekable: boolean},
    creationDate: bigint,
    fileId: string,
    fileSize: bigint, 
    packetCount: bigint,
    playDuration: bigint,
    sendDuration: bigint,
    preroll: bigint,
    minPacketSize: number,
    maxPacketSize: number,
    maxBitRate: number
}

export interface DataObjectData {
    type: DataType.DATA_OBJECT,
    dataSize: bigint,
    totalDataPackets: bigint,
    data: Uint8Array,
    withHeader: Uint8Array
}

export interface PacketData {
    type: DataType.DATA_PACKET,
    opaqueData: boolean,
    ecc: boolean,
    sendTime: number,
    data: Uint8Array
}

export type ASFData = HeaderData | FileInfoData | DataObjectData | PacketData

export function bunToNodeStream(stream: ReadableStream): Readable {
    const nodeStream = new Transform()

    stream.pipeTo(new WritableStream({
        write(value) {   
            nodeStream.push(value)
        },
        close() {
            nodeStream.push(null)
        }
    }))
    return nodeStream
}

export async function* readASF(stream: Readable): AsyncGenerator<ASFData, void, void> {
    const reader = new StreamReader(stream)

    const initialHeader = new Uint8Array(24)
    await reader.peek(initialHeader, 0, 24)

    const iHeaderT = await strtok3.fromBuffer(initialHeader)
    
    // HEADER
    if (await iHeaderT.readToken(GUID) !== DataType.HEADER) {
        throw Error("[asf] invalid header")
    }
    const size = await iHeaderT.readToken(Token.UINT64_LE)
    if (size < 30) {
        throw Error("[asf] invalid size")
    }

    const header = new Uint8Array(Number(size))
    await reader.read(header, 0, Number(size))

    yield {
        type: DataType.HEADER,
        data: header
    }

    // OTHER PART OF HEADER
    const headerT = await strtok3.fromBuffer(header)
    await headerT.ignore(24) // initial header
    const nHeader = await headerT.readNumber(Token.INT32_LE)
    await headerT.ignore(1) // reserved
    if (await headerT.readNumber(Token.INT8) != 2) {
        throw Error("[asf] invalid header")
    }

    let fileInfo: FileInfoData | undefined = undefined;

    for (let i = 0; i < nHeader; i++) {
        const guid = await headerT.readToken(GUID)
        const size = await headerT.readToken(Token.UINT64_LE)

        if (guid === DataType.FILE_PROPERTIES) {
            if (size < 104) throw Error("[asf] invalid file property object")
            const fileId = await headerT.readToken(GUID)
            const fileSize = await headerT.readToken(Token.UINT64_LE)
            const creationDate = await headerT.readToken(Token.UINT64_LE)
            const packetCount = await headerT.readToken(Token.UINT64_LE)
            const playDuration = await headerT.readToken(Token.UINT64_LE)
            const sendDuration = await headerT.readToken(Token.UINT64_LE)
            const preroll = await headerT.readToken(Token.UINT64_LE)
            const flags = await headerT.readNumber(Token.INT32_LE)
            const minPacketSize = await headerT.readNumber(Token.INT32_LE)
            const maxPacketSize = await headerT.readNumber(Token.INT32_LE)
            const maxBitRate = await headerT.readNumber(Token.INT32_LE)

            const friendlyFlags = {
                broadcast: (flags & 1) === 1,
                seekable: ((flags >> 1) & 1) === 1
            }

            fileInfo = {
                type: guid,
                flags: friendlyFlags,
                creationDate,
                fileId, fileSize, packetCount, playDuration, sendDuration, preroll, minPacketSize, maxPacketSize, maxBitRate
            }
            yield fileInfo
        } else {
            await headerT.ignore(Number(size) - 24) // i hope this is safe
            // console.log(`[asf] skipping over header ${guid}`)
        }
    }
    if (!fileInfo) {
        throw Error("[asf] file info object not found")
    }

    // DATA
    const fixedBeforeData = new Uint8Array(50)
    await reader.read(fixedBeforeData, 0, 50)

    const bodyT = await strtok3.fromBuffer(fixedBeforeData)
    if (await bodyT.readToken(GUID) !== DataType.DATA_OBJECT) {
        throw Error("[asf] data object not found")
    }
    const dataSize = await bodyT.readToken(Token.UINT64_LE)
    if (dataSize < 50) {
        throw Error("[asf] invalid data size")
    }
    await bodyT.ignore(16) // file guid
    const totalDataPackets = await bodyT.readToken(Token.UINT64_LE)
    await bodyT.ignore(2) // reserved

    yield {
        type: DataType.DATA_OBJECT,
        dataSize, totalDataPackets,
        data: fixedBeforeData,
        withHeader: concat(header, fixedBeforeData)
    }

    let packetReadCount = 0;

    
    while ((totalDataPackets > 0 ? packetReadCount < totalDataPackets : true)) { // we don't know how long this goes on because this could very well be a stream
        const packet = new Uint8Array(fileInfo.maxPacketSize)

        try {
            await reader.read(packet, 0, fileInfo.maxPacketSize)
        } catch (e) {
            if (e instanceof EndOfStreamError) {
                break
            }
        }
        
        const packetT = await strtok3.fromBuffer(packet)
        let flags = await packetT.readNumber(Token.UINT8)

        const ecc = flags >> 7 === 1
        const opaqueData = ((flags >> 4) & 1) === 1

        if (ecc) {
            await packetT.ignore(2)
            flags = await packetT.readNumber(Token.UINT8)
        }
        
        await packetT.ignore(
            1 +
            HEADER_LENGTH_MAP[((flags >> 1) & 3)] +
            HEADER_LENGTH_MAP[((flags >> 3) & 3)] + 
            HEADER_LENGTH_MAP[((flags >> 5) & 3)]
        )

        const sendTime = await packetT.readNumber(Token.UINT32_LE)
        
        yield {
            type: DataType.DATA_PACKET,
            opaqueData, ecc,
            sendTime,
            data: packet
        }
        packetReadCount++
    }
}