import Foundation
import AVFoundation

// Protocol:
// STDIN  ← "START\n" | "STOP\n" | "EXIT\n"
// STDOUT → raw PCM audio (16-bit signed, 16 kHz, mono) — binary, streamed continuously
// STDERR → JSON control lines: {"type":"authorized"} | {"type":"ready"} | {"type":"stopped"} | {"type":"error","message":"..."}

class SpeechHelper: NSObject {
    private let audioEngine   = AVAudioEngine()
    private var converter: AVAudioConverter?
    private var isRunning     = false

    // Deepgram expects 16-bit signed PCM, 16 kHz, mono
    private let targetFormat  = AVAudioFormat(
        commonFormat: .pcmFormatInt16,
        sampleRate:   16_000,
        channels:     1,
        interleaved:  true
    )!

    func run() {
        requestPermission {
            self.control(["type": "authorized"])
            self.listenForCommands()
        }
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    private func requestPermission(completion: @escaping () -> Void) {
        AVCaptureDevice.requestAccess(for: .audio) { granted in
            if granted {
                completion()
            } else {
                self.control(["type": "error", "message": "Microphone permission denied"])
                exit(1)
            }
        }
    }

    // ── Command loop ──────────────────────────────────────────────────────────

    private func listenForCommands() {
        DispatchQueue.global(qos: .userInitiated).async {
            while let line = readLine() {
                switch line.trimmingCharacters(in: .whitespacesAndNewlines) {
                case "START": DispatchQueue.main.async { self.startCapture() }
                case "STOP":  DispatchQueue.main.async { self.stopCapture() }
                case "EXIT":  exit(0)
                default:      break
                }
            }
        }
    }

    // ── Audio capture ─────────────────────────────────────────────────────────

    private func startCapture() {
        guard !isRunning else { return }

        let inputNode   = audioEngine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)

        guard let conv = AVAudioConverter(from: inputFormat, to: targetFormat) else {
            control(["type": "error", "message": "Cannot create audio converter"])
            return
        }
        converter = conv

        inputNode.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { [weak self] inBuf, _ in
            guard let self = self, let conv = self.converter else { return }

            // Calculate output frame count after resampling
            let ratio      = self.targetFormat.sampleRate / inputFormat.sampleRate
            let outFrames  = AVAudioFrameCount(Double(inBuf.frameLength) * ratio)
            guard let outBuf = AVAudioPCMBuffer(pcmFormat: self.targetFormat, frameCapacity: outFrames) else { return }

            var inputConsumed = false
            conv.convert(to: outBuf, error: nil) { _, status in
                if inputConsumed { status.pointee = .noDataNow; return nil }
                status.pointee  = .haveData
                inputConsumed   = true
                return inBuf
            }

            guard outBuf.frameLength > 0, let int16Ptr = outBuf.int16ChannelData else { return }
            let byteCount = Int(outBuf.frameLength) * 2   // 16-bit = 2 bytes per sample
            let data      = Data(bytes: int16Ptr[0], count: byteCount)
            FileHandle.standardOutput.write(data)
        }

        do {
            audioEngine.prepare()
            try audioEngine.start()
            isRunning = true
            control(["type": "ready"])
        } catch {
            control(["type": "error", "message": "Audio engine failed: \(error.localizedDescription)"])
        }
    }

    private func stopCapture() {
        guard isRunning else { return }
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        converter  = nil
        isRunning  = false
        control(["type": "stopped"])
    }

    // ── Control messages → stderr (stdout is reserved for audio) ─────────────

    private func control(_ dict: [String: String]) {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let str  = String(data: data, encoding: .utf8) else { return }
        FileHandle.standardError.write((str + "\n").data(using: .utf8)!)
        fflush(stderr)
    }
}

let helper = SpeechHelper()
helper.run()
RunLoop.main.run()
