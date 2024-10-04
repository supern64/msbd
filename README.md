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
## NSCUtil
This codebase also includes a utility to encode NetShow format strings for NetShow multicasting. (though they are not likely to match with what would've originally generated them), for example
```
bun nsc media/free_movie.asf "halal movie 2019"
```
will output something like
```
Format=02Y0000G4000G8C2QoTOvcpn6csG2g06BERDO3000000001W000042eTohZ4Ufpn6Ev030321JPMW0000000000000000000000000000007xwS0000000080{rTwndG492G0000000E3UEv4000008DbYZm00000S30000000008000203000W0m0001h0m2r0xzVBgdF4OxZ0C0C85Db5G400000000HqjEhkgdF4Oxc0C0C85Db1W3d0000gKP3VE3l}4koAJa{ta5SXI40000000000G06PG1k0000owNc57B6CaE3cQbfKWPRMbW000000000000000000000000000000C1T00284m0000000C1T00284m0000000000000200000W0000000000000000000EhB{CMlMtT8X6UgZ4JwJCfk000000000080000101e00m040000GG1p0700PG1Z07G0KW1X07G0QG1l05W000010000000101e00m040000GG1p0700PG1Z07G0KW1X07G0QG1l05a000010000GAJGqWVZqX6Ny02WoLweKEm000000000100a04C0Jm1D0500GG1K04a0GW1C04K0Nm120580GG1E04G0Km0000004W1f07C0Rm0s06q0S00q0340000O04q0GG1A04y0KW1V0480KW1104u0H00000002W1a0640Sm1e0000701D04a0JW1F0580Nm1M04K0KW1J04a0Jm1E000000040300000e05S0JG0l04K0RW1Z06y0P01f06u0Pm1J06K0T01q06a0RW1d07C0000001e0J01X07O0PW0s0340BW0n02u0CG0m0300002H1zotjwdF4Oxc0C0C85DbWG0000000030xncyJLlF4QZz081VN4Gh05Vx85LRpn6e}G20Nrn4Am0000000000Cm0000000001000000100G00y000008e02W000100G00y0000040601DK3Gp08G300000000000000000000002H1zotjwdF4Oxc0C0C85DbR00000000010dcduJLlF4QZz081VN4GhKCt3luzXpn6BiW2g0BJY8000000000005W0000W000020000001W0G808bO00BWB002B0100100000400Oi0Ym010010Kj667J7G4QEa0A390qZsOW0000000011Kj667J7G4QEa0A390qZs0W0000402W1j07C0RG1m06K0Pm0q07O0Cm000000101DK3Gp0W0607S0RG1X07O0CG0000000W1W0JOcidMEPiyHfja0gW1Ypcooy70000000000000000000000000000092G0000000041
Description=02Em000000000XQ01X06m0OG1i0200RG1l07O0QG1b0200CW0m0340EG00
```
Which you then can put into a .nsc export (changing the Format by the order of the formats already in the file), then reimport back into Windows Media Server.
