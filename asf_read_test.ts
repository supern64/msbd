import { bunToNodeStream, DataType, readASF } from "./protocol/asf"

// 

for await (const data of readASF(bunToNodeStream(Bun.file("stream_lq.asf").stream()))) {
    if (data.type === DataType.DATA_PACKET && data.data[0] != 130) console.log("weird data packet")
}