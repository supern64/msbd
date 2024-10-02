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
    "720p30": {
        flags: ["-r", "30", "-vf", "scale=1280:720"],
        position: FlagPosition.AFTER_INPUT
    }
}