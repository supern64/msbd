# MSBD Protocol Server/Windows Media Encoder
Simulates a Windows Media Encoder for a Windows Media Server with the msbd:// protocol
## A note
PLEASE PLEASE PLEASE do NOT run this in production  
You will probably break something in here, I do not take responsiblity if one of your servers gets broken into with this
## How to use
1. Download [bun](https://bun.sh)
2. Download code via zip or git
3. Install dependencies (`bun install`)
4. Run the server, see options below
## Options
```
msbd - MSBD Protocol/Windows Media Encoder Emulator
Available flags:
    -h, --help              Shows this page
    -p, --port              Port to use [default: 7007]
    -c, --config            Flags to use (see below)
    -m, --media             The media to play (file/URL)
    -l, --playlist          A .txt file of media to play, line-by-line, with flags

Valid flags (check server/constants.ts):
    15                      Downsamples video to 15fps
    30                      Downsamples video to 30fps
    silent                  Hides ffmpeg's banner & only logs errors (highly recommended)
    stats                   Show stats from ffmpeg
    direct                  Stream .asf file directly, overrides all other flags
    copy                    Copy codec (you may want to try direct first)
    music                   For music streams (ignores video stream)
    video                   For video streams
    re                      Read file in the same framerate (highly recommended)
    hq                      Scales video down to 720p in original aspect ratio
    mq                      Scales video down to 480p in original aspect ratio
    lq                      Scales video down to 288p in original aspect ratio
    mq43                    Scales 16:9 video down to 640x480 with letterboxing
    lq43                    Scales 16:9 video down to 384x288 with letterboxing
```

## Notes & Example
- If you are going through ffmpeg I highly recommend  `-c re` since you're likely to send packets too fast otherwise.  
- I also highly recommend using `-c silent` since ffmpeg won't shut up.
- The "mq43" flag is ideal for bitrate/framerate balance (and it also plays correctly on some older players)
- If you have an .asf file, you can play them directly with `-c direct` which bypasses ffmpeg

Play music from `media/moonlight.flac`
```
bun start -c silent -c music -c re -m media/moonlight.flac
```
Play ASF video from `media/free_movie.asf` without going through ffmpeg
```
bun start -c direct -m media/free_movie.asf
```
Reencode, letterbox downscale to 640x480 & play video from `media/rickroll.mp4`
```
bun start -c silent -c re -c video -c mq43 -m media/free_movie.asf
```
Play items from the playlist at `media/playlist.txt` (maintains the `-c silent` and `-c re` flag for all of them)
```
bun start -c silent -c re -l media/playlist.txt
```
## Playlist file format
```
source||flag1,flag2
```
where `source` is a valid ffmpeg MRL, and `flag1`/`flag2` are flags to use for that item
## Example
```
media/free_movie.asf||direct
media/rickroll.mp4||video,mq43
media/john_cena_entrance_theme.mp3||audio
```