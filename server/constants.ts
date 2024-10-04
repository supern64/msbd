/*
    flags for ffmpeg
*/

export enum FlagPosition {
    BEFORE_INPUT,
    AFTER_INPUT,
    NONE
}

export interface Flag {
    flags: string[],
    description: string,
    position: FlagPosition
}

export const FLAGS: {[key: string]: Flag} = {
    "silent": {
        description: "Hides ffmpeg's banner & only logs errors (highly recommended)",
        flags: ["-hide_banner", "-loglevel", "error"],
        position: FlagPosition.BEFORE_INPUT
    },
    "stats": {
        description: "Show stats from ffmpeg",
        flags: ["-stats"],
        position: FlagPosition.BEFORE_INPUT
    },
    "direct": {
        description: "Stream .asf file directly, overrides all other flags",
        flags: [],
        position: FlagPosition.NONE
    },
    "copy": {
        description: "Copy codec (you may want to try direct first)",
        flags: ["-c", "copy"],
        position: FlagPosition.AFTER_INPUT
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
        description: "Read file in the same framerate (highly recommended)",
        flags: ["-re"],
        position: FlagPosition.BEFORE_INPUT
    },
    "hq": {
        description: "Scales video down to 720p in original aspect ratio",
        flags: ["-vf", "scale=-1:720"],
        position: FlagPosition.AFTER_INPUT
    },
    "mq": {
        description: "Scales video down to 480p in original aspect ratio",
        flags: ["-vf", "scale=-1:480"],
        position: FlagPosition.AFTER_INPUT
    },
    "lq": {
        description: "Scales video down to 288p in original aspect ratio",
        flags: ["-vf", "scale=-1:288"],
        position: FlagPosition.AFTER_INPUT
    },
    "mq43": {
        description: "Scales 16:9 video down to 640x480 with letterboxing",
        flags: ["-vf", "scale=640:-1,pad=640:480:-1:-1"],
        position: FlagPosition.AFTER_INPUT
    },
    "lq43": {
        description: "Scales 16:9 video down to 384x288 with letterboxing",
        flags: ["-vf", "scale=384:-1,pad=384:288:-1:-1"],
        position: FlagPosition.AFTER_INPUT
    },
    "30": {
        description: "Downsamples video to 30fps",
        flags: ["-r", "30"],
        position: FlagPosition.AFTER_INPUT
    },
    "15": {
        description: "Downsamples video to 15fps",
        flags: ["-r", "15"],
        position: FlagPosition.AFTER_INPUT
    }
}