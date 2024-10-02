export enum FlagPosition {
    BEFORE_INPUT,
    AFTER_INPUT
}

export interface Flag {
    flags: string[],
    position: FlagPosition
}

export const FFMPEG_FLAGS: {[key: string]: Flag} = {
    "silent": {
        flags: ["-hide_banner", "-loglevel", "error"],
        position: FlagPosition.BEFORE_INPUT
    },
    "music": {
        flags: ["-vn", "-c:a", "wmav2"],
        position: FlagPosition.AFTER_INPUT
    },
    "video": {
        flags: ["-c:v", "msmpeg4", "-c:a", "wmav2"],
        position: FlagPosition.AFTER_INPUT
    },
    "re": {
        flags: ["-re"],
        position: FlagPosition.BEFORE_INPUT
    },
    "hq": {
        flags: ["-r", "30", "-vf", "scale=-1:720"],
        position: FlagPosition.AFTER_INPUT
    },
    "mq": {
        flags: ["-r", "30", "-vf", "scale=-1:480"],
        position: FlagPosition.AFTER_INPUT
    },
    "lq": {
        flags: ["-r", "15", "-vf", "scale=-1:288"],
        position: FlagPosition.AFTER_INPUT
    }
}