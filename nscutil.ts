/*
    NSC utility command line
*/

import { parseArgs } from "util";
import { bunToNodeStream, DataType, readASF } from "./protocol/asf";
import { encode } from "./util/nsc";
import { toUTF16 } from "./util/encoding";

if (Bun.argv.length < 3) {
        console.log(`
nscutil - Generates format metadata for NetShow
Usage:
    nscutil [asf] [description]
    asf             The .asf file to generate data for
    description     Human readable description of format`)
    process.exit(1)
}

export const { positionals: args } = parseArgs({allowPositionals: true})

const filePath = args[0]
const file = Bun.file(filePath)
let header;

for await (const data of readASF(bunToNodeStream(file.stream()))) {
    if (data.type === DataType.DATA_OBJECT) {
        header = data.withHeader
        break
    }
}

if (!header) {
    console.error("Header not found. Is this even an .asf file????")
    process.exit(1)
}

// """cryptographically secure hash"""
let hash = Bun.hash.crc32(header)
hash = ((hash & 0xFFFF0000) >> 16) ^ (hash & 0x0000FFFF)
hash = ((hash & 0xF800) >> 8) ^ (hash & 0x07FF)

console.log(`Format=${encode(hash, header)}`)
console.log(`Description=${encode(0, toUTF16(args.slice(1).join(" ") || "Default description for file format", true))}`)