# Working notes — Windows build (ThinkPad, Win11, Iris Xe)

## Build from source on this machine

```sh
cargo build --release -p raea-cli --no-default-features -j 4
```

Binary: `target/release/raea.exe` (`0.1.0-checkout`). Full release build took ~55 min on
i5-1145G7; `target/` ≈ 11 GB.

## Required env for a build session

Persisted at user scope (set 2026-11-26) — new terminals get these automatically:

- PATH: `G:\Project\raea\target\release`, `G:\tools\ffmpeg-9.1-essentials_build\bin`,
  `G:\tools\cmake-4.5.1-windows-x86_64\bin`, `G:\tools\ninja`, `G:\tools\nasm-2.16.03`,
  `~\.cargo\bin`, `~\AppData\Local\Programs\Python\Python311`
- Env: `PYTHON3`, `CARGO_NET_RETRY=10`, `CARGO_HTTP_MULTIPLEXING=false`,
  `CARGO_HTTP_TIMEOUT=90`, `CARGO_HTTP_CHECK_REVOKE=false`, `CARGO_NET_GIT_FETCH_WITH_CLI=true`

For a non-persisted shell (or another machine) the equivalents are:

```sh
export PATH="$HOME/.cargo/bin:$HOME/.bun/bin:/g/tools/cmake-4.5.1-windows-x86_64/bin:/g/tools/ninja:/g/tools/nasm-2.16.03:$LOCALAPPDATA/Programs/Python/Python311:$PATH"
export PYTHON3="C:\\Users\\ThinkPad\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
export CARGO_NET_RETRY=10 CARGO_HTTP_MULTIPLEXING=false CARGO_HTTP_TIMEOUT=90 \
       CARGO_HTTP_CHECK_REVOKE=false CARGO_NET_GIT_FETCH_WITH_CLI=true
```

## Why each piece is needed

- **Rust 1.99.1** — pinned by `rust-toolchain.toml`; installed via rustup in `~/.cargo/bin`.
- **MSVC Build Tools 2022** — already installed; cargo finds `link.exe` itself.
- **bun** 1.4.5 (`~/.bun/bin`) — `bun install` in `sdk/raea`, `sdk/react/js`, `sdk/react/tw`.
- **cmake + ninja** (`G:\tools\`) — native dep builds (`-sys` crates). Portable zips, no admin.
- **nasm** (`G:\tools\nasm-2.16.03`) — `rav1d` build script panics without it.
- **Python 3.11** (`%LOCALAPPDATA%\Programs\Python\Python311`) — `stylo` build script needs
  `python.exe` on PATH or `PYTHON3` set. Already installed, just not on PATH.

## Gotchas hit

- **G: is a USB SSD (JMicron bridge).** Heavy I/O caused a transient disconnect mid-build
  (`os error 21 "device is not ready"`). Fixed by disabling USB selective suspend:
  `powercfg -setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0`
  (AC and DC). Build resumed incrementally after reconnect. Keep `-j 4` to reduce I/O bursts.
- **Flaky crates.io access**: HTTP/2 resets — `CARGO_HTTP_MULTIPLEXING=false` fixed it.
- **`raea check` needs `ffprobe`** on PATH — ffmpeg lives at `G:\tools\ffmpeg-9.1-essentials_build\bin`.
- Encoder on Windows is OpenH264 (CPU); Media Foundation hardware encode is not implemented upstream.

## Gotcha: where compositions live

`raea render` stages the composition's **whole folder** into a temp work dir; a `tsconfig.json`
in that folder comes along and its `extends` must resolve inside the stage. `examples/tsconfig.json`
extends `../sdk/tsconfig.base.json` → `REFUSED ... Tsconfig not found`. Put your own compositions in
a folder **without** a tsconfig (e.g. `demo/`) — the bundler's default tsconfig then applies and
`import ... from "raea"` resolves on its own.

## Smoke test that passed

```sh
./target/release/raea.exe render sdk/react/bench/games/pong/edit.tsx -o pong.mp4
# 4668 frames at ~30.5 ms/frame on Iris Xe
```
