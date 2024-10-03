/* 
    buffer and encoding utilities
*/

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