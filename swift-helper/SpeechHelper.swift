import Foundation
import Speech
import AVFoundation

// Protocol over stdin/stdout:
// STDIN  → "START\n" | "STOP\n" | "EXIT\n"
// STDOUT → JSON lines: {"type":"ready"} | {"type":"partial","text":"..."} | {"type":"final","text":"..."} | {"type":"error","message":"..."}

class SpeechHelper: NSObject {
    private var recognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private var isRecording = false

    func run() {
        requestAuthorization {
            self.send(["type": "authorized"])
            self.listenForCommands()
        }
    }

    private func requestAuthorization(completion: @escaping () -> Void) {
        SFSpeechRecognizer.requestAuthorization { status in
            switch status {
            case .authorized:
                completion()
            case .denied:
                self.send(["type": "error", "message": "Speech recognition permission denied"])
                exit(1)
            case .restricted:
                self.send(["type": "error", "message": "Speech recognition restricted on this device"])
                exit(1)
            case .notDetermined:
                self.send(["type": "error", "message": "Speech recognition permission not determined"])
                exit(1)
            @unknown default:
                self.send(["type": "error", "message": "Unknown authorization status"])
                exit(1)
            }
        }
    }

    private func listenForCommands() {
        // Run on background thread so we don't block the run loop
        DispatchQueue.global(qos: .userInitiated).async {
            while let line = readLine() {
                let command = line.trimmingCharacters(in: .whitespacesAndNewlines)
                switch command {
                case "START":
                    DispatchQueue.main.async { self.startRecognition() }
                case "STOP":
                    DispatchQueue.main.async { self.stopRecognition() }
                case "EXIT":
                    exit(0)
                default:
                    break
                }
            }
        }
    }

    func startRecognition() {
        guard !isRecording else { return }

        recognizer = SFSpeechRecognizer(locale: Locale.current)
        guard let recognizer = recognizer, recognizer.isAvailable else {
            send(["type": "error", "message": "Speech recognizer not available"])
            return
        }

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        recognitionRequest.shouldReportPartialResults = true

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            if let result = result {
                let type = result.isFinal ? "final" : "partial"
                self.send(["type": type, "text": result.bestTranscription.formattedString])
            }
            if let error = error {
                self.send(["type": "error", "message": error.localizedDescription])
                self.stopRecognition()
            }
        }

        do {
            audioEngine.prepare()
            try audioEngine.start()
            isRecording = true
            send(["type": "ready"])
        } catch {
            send(["type": "error", "message": "Audio engine failed to start: \(error.localizedDescription)"])
        }
    }

    func stopRecognition() {
        guard isRecording else { return }
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        recognizer = nil
        isRecording = false
        send(["type": "stopped"])
    }

    private func send(_ dict: [String: String]) {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let str = String(data: data, encoding: .utf8) else { return }
        print(str)
        // fflush is critical — without it, Node.js won't receive lines until buffer fills
        fflush(stdout)
    }
}

// Run loop required for SFSpeechRecognizer async callbacks
let helper = SpeechHelper()
helper.run()
RunLoop.main.run()
