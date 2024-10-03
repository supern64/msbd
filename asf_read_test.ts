import { bunToNodeStream, DataType, readASF } from "./protocol/asf"

// testing file, nothing to see here~

for await (const data of readASF(bunToNodeStream(Bun.file("test_media/stream_lq.asf").stream()))) {
    if (data.type !== DataType.DATA_PACKET) console.log(data)
}