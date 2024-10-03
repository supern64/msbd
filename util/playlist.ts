/*
    playlist storage (.txt file)
*/

import { FFMPEG_FLAGS, type Flag } from "../server/constants";

export interface PlaylistEntry {
    source: string,
    flags: Flag[]
}

export async function getPlaylistFromFile(path: string) {
    const text = await Bun.file(path).text()
    const entries = text.split("\n").map((r) => r.trim())
    const finalArray: PlaylistEntry[] = [];
    for (const entry of entries) {
        const entryArray = entry.split("||")
        const flags = entryArray[1].split(",").map((r) => r.trim())
        if (!flags.every((r) => FFMPEG_FLAGS[r])) {
            throw Error(`invalid flag in playlist, valid flags are ${Object.keys(FFMPEG_FLAGS).join(", ")}`)
        }
        const pEntry = {
            source: entryArray[0],
            flags: flags.map((r) => FFMPEG_FLAGS[r])
        }
        finalArray.push(pEntry)
    }
    return finalArray
}