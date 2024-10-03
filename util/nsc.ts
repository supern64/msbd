import BitArray, { type bit } from "@bitarray/typedarray";
import { concat } from "../util/encoding";

// netshow binary string decoding
// used to encode binary stuff in .nsc files

const CHARACTER_SET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz{}"
const INVERSE_LOOKUP_TABLE = [
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
    0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
    0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
    0x21, 0x22, 0x23, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a,
    0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32,
    0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a,
    0x3b, 0x3c, 0x3d, 0x3e, 0xff, 0x3f, 0xff, 0xff
]

function encode(key: number, array: Uint8Array): string {
    const header = new Uint8Array(9)
    const view = new DataView(header.buffer)

    view.setUint32(1, key, false)
    view.setUint32(5, array.length, false)

    const toEncode = concat(header, array)
    toEncode[0] = toEncode.slice(1).reduce((p, c) => {return p ^ c}) // CRC
    return "02" + rawEncode(toEncode)
}

function decode(string: string): Uint8Array {
    if (string.startsWith("02")) string = string.slice(2)
    const decoded = rawDecode(string)
    const crc = decoded.slice(1).reduce((p, c) => {return p ^ c})
    if (decoded[0] !== crc) throw Error("invalid CRC")
    return decoded.slice(9)
}

// does not add or strip headers
// DO NOT FORGET: strings stored in nsc files usually have 02 in front of them
function rawEncode(array: Uint8Array): string {
    const bitArray = new BitArray(array.length * 8)
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < 8; j++) {
            bitArray[i*8+j] = ((array[i] >> (8 - j - 1)) & 1) as bit
        }
    }

    let string = ""
    for (let i = 0; i < bitArray.length; i += 6) {
        let val = 0
        for (let j = 0; j < 6; j++) {
            val = val | (bitArray[i + j] || 0)
            val <<= 1
        }
        val >>= 1
        string += CHARACTER_SET[val]
    }
    return string
}

function rawDecode(string: string): Uint8Array {
    // calculate length in bytes
    const length = Math.floor((string.length * 6) / 8)
    const bitArray = new BitArray(string.length * 6)

    let bitPtr = 0
    for (const char of string) {
        let bitGroup = INVERSE_LOOKUP_TABLE[char.charCodeAt(0)]
        for (let i = 0; i < 6; i++) {
            bitArray[bitPtr + i] = ((bitGroup >> (6 - i - 1)) & 1) as bit
        }
        bitPtr += 6
    }

    const buffer = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
        for (let j = 0; j < 8; j++) {
            buffer[i] = buffer[i] | (bitArray[i*8+j] << (8 - j - 1))
        }
    }
    return buffer
}
