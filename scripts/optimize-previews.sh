#!/usr/bin/env bash
set -euo pipefail

# Re-encode marquee preview clips to lighter VP9 WebM files.
# Requires ffmpeg with libvpx-vp9 + libopus support.
# Usage: ./scripts/optimize-previews.sh

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INPUT_DIR="$PROJECT_ROOT/assets/media/videos"
OUTPUT_DIR="$PROJECT_ROOT/assets/media/videos"

# target video bitrate settings
VIDEO_BITRATE="1500k"
MAX_RATE="2000k"
BUF_SIZE="3000k"
AUDIO_BITRATE="96k"
SCALE_WIDTH=720

optimize() {
  local name="$1"
  local src="$INPUT_DIR/${name}.webm"
  local tmp="$OUTPUT_DIR/${name}.webm.tmp"

  if [[ ! -f "$src" ]]; then
    echo "Skipping $name (missing $src)" >&2
    return
  fi

  echo "Optimizing $src"
  ffmpeg \
    -y \
    -i "$src" \
    -vf "scale=${SCALE_WIDTH}:-2" \
    -c:v libvpx-vp9 \
    -b:v "$VIDEO_BITRATE" \
    -maxrate "$MAX_RATE" \
    -bufsize "$BUF_SIZE" \
    -row-mt 1 \
    -tile-columns 1 \
    -frame-parallel 1 \
    -g 48 \
    -threads 4 \
    -c:a libopus \
    -b:a "$AUDIO_BITRATE" \
    "$tmp"

  mv "$tmp" "$src"
}

optimize printedPoster
optimize runnersRotation
optimize chefPortfolio
optimize neoBauhaus
optimize hummingbirdPantry
optimize bazaar

echo "All preview clips optimized."
