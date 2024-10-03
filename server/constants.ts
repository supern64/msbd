/*
    flags for ffmpeg
*/

export enum FlagPosition {
    BEFORE_INPUT,
    AFTER_INPUT
}

export interface Flag {
    flags: string[],
    description: string,
    position: FlagPosition
}

export const FFMPEG_FLAGS: {[key: string]: Flag} = {
    "silent": {
        description: "Hides ffmpeg's banner",
        flags: ["-hide_banner", "-loglevel", "error"],
        position: FlagPosition.BEFORE_INPUT
    },
    "stats": {
        description: "Show stats from ffmpeg",
        flags: ["-stats"],
        position: FlagPosition.BEFORE_INPUT
    },
    "music": {
        description: "For music streams (ignores video stream)",
        flags: ["-vn", "-c:a", "wmav2"],
        position: FlagPosition.AFTER_INPUT
    },
    "video": {
        description: "For video streams",
        flags: ["-c:v", "msmpeg4", "-c:a", "wmav2"],
        position: FlagPosition.AFTER_INPUT
    },
    "re": {
        description: "Read original file in the same framerate",
        flags: ["-re"],
        position: FlagPosition.BEFORE_INPUT
    },
    "hq": {
        description: "Scales video down to 720p30 in original aspect ratio",
        flags: ["-r", "30", "-vf", "scale=-1:720"],
        position: FlagPosition.AFTER_INPUT
    },
    "mq": {
        description: "Scales video down to 480p30 in original aspect ratio",
        flags: ["-r", "30", "-vf", "scale=-1:480"],
        position: FlagPosition.AFTER_INPUT
    },
    "lq": {
        description: "Scales video down to 288p30 in original aspect ratio",
        flags: ["-r", "15", "-vf", "scale=-1:288"],
        position: FlagPosition.AFTER_INPUT
    },
    "mq43": {
        description: "Scales 16:9 video down to 640x480 with letterboxing",
        flags: ["-r", "30", "-vf", "scale=640:-1,pad=640:480:-1:-1"],
        position: FlagPosition.AFTER_INPUT
    },
    "lq43": {
        description: "Scales 16:9 video down to 384x288 with letterboxing",
        flags: ["-r", "15", "-vf", "scale=384:-1,pad=384:288:-1:-1"],
        position: FlagPosition.AFTER_INPUT
    }
}