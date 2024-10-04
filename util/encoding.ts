/* 
    buffer and encoding utilities
*/

export function fromUTF16(array: Uint8Array): string {
    // UTF-16 always has 2 bytes per character,
    // which means if there's an odd number of bytes there's a null terminator
    if (array.length % 2 === 1) array = array.slice(0, array.length - 1)
    return Buffer.from(array).toString("utf16le")
}

export function toUTF16(str: string, nullTerminate: boolean = false): Uint8Array {
    const buffer = new Uint8Array(Buffer.from(str, "utf16le"))
    if (nullTerminate) {
        return concat(buffer, new Uint8Array(1))
    }
    return buffer
}

export function concat(...byte: Uint8Array[]): Uint8Array {
    return new Uint8Array(Buffer.concat(byte))
}