#!/usr/bin/env bash

set -euo pipefail

prompt="${1:-}"
base="$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//; s/--*/-/g')"

if [ -z "$base" ]; then
  base="image"
fi

base="${base:0:48}"
filename="chatgpt-generated-${base}.png"

if [ ! -e "$filename" ]; then
  printf '%s\n' "$filename"
  exit 0
fi

counter=2
while [ -e "chatgpt-generated-${base}-${counter}.png" ]; do
  counter=$((counter + 1))
done

printf 'chatgpt-generated-%s-%s.png\n' "$base" "$counter"
