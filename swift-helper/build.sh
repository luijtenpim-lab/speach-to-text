#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT="$SCRIPT_DIR/SpeechHelper"
ENTITLEMENTS="$(dirname "$SCRIPT_DIR")/build/entitlements.mac.plist"

echo "Building Swift helper..."
swiftc \
  -O \
  -framework Foundation \
  -framework Speech \
  -framework AVFoundation \
  -Xlinker -sectcreate \
  -Xlinker __TEXT \
  -Xlinker __info_plist \
  -Xlinker "$SCRIPT_DIR/Info.plist" \
  "$SCRIPT_DIR/SpeechHelper.swift" \
  -o "$OUTPUT"

# Re-sign to bind Info.plist into the code signature
# Required on macOS 14+ for TCC to find NSSpeechRecognitionUsageDescription
if [ -f "$ENTITLEMENTS" ]; then
  codesign --force --sign - --entitlements "$ENTITLEMENTS" --options runtime "$OUTPUT"
else
  codesign --force --sign - --options runtime "$OUTPUT"
fi

chmod +x "$OUTPUT"
echo "Built: $OUTPUT"
