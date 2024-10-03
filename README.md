# MSBD Protocol Server/Windows Media Encoder
Simulates a Windows Media Encoder for a Windows Media Server with the msbd:// protocol
## A note
PLEASE PLEASE PLEASE do NOT run this in production  
You will probably break something in here, I do not take responsiblity if one of your servers gets exploited with this
## How to use
1. Download [bun](https://bun.sh)
2. Download code via zip or git
3. Install dependencies (`bun install`)
4. Run the server, see options below
## Options
```
Available flags:
    -p, --port              Port to use [default: 7007]
    -c, --config            FFMPEG flag presets to use (see below)
    -m, --media             The media to play (file/URL that ffmpeg can open)
    -l, --playlist          A .txt file of media to play, line-by-line, with flags

Valid presets (check server/constants.ts):
    15                      Renders video to 15fps
    30                      Renders video to 30fps
    silent                  Hides ffmpeg's banner
    stats                   Show stats from ffmpeg
    copy                    Copy codec (for streaming .asf files)
    music                   For music streams (ignores video stream)
    video                   For video streams
    re                      Read original file in the same framerate
    hq                      Scales video down to 720p in original aspect ratio
    mq                      Scales video down to 480p in original aspect ratio
    lq                      Scales video down to 288p in original aspect ratio
    mq43                    Scales 16:9 video down to 640x480 with letterboxing
    lq43                    Scales 16:9 video down to 384x288 with letterboxing
```

## Example
- I highly recommend running all of these with `-c re` since you're likely to send packets too fast otherwise.  
- I also highly recommend using `-c silent` since ffmpeg won't shut up.

Play music from `media/moonlight.flac`
```
bun start -c silent -c music -c re -m media/moonlight.flac
```
Play ASF video from `media/free_movie.asf`
```
bun start -c silent -c re -c copy -m media/free_movie.asf
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
media/free_movie.asf||copy
media/rickroll.mp4||video,mq43
media/john_cena_entrance_theme.mp3||audio
```