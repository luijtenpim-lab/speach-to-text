/**
 * DeepgramBridge — invisible component that lives in the renderer.
 * The renderer has full browser WebSocket (no Electron network restrictions).
 * Main process sends the API key → renderer opens WS → streams audio chunks
 * received via SharedArrayBuffer isn't available, so main sends PCM via IPC.
 *
 * Flow:
 *   main  --[deepgram:key]--> renderer opens WebSocket
 *   main  --[audio:chunk]-->  renderer forwards to Deepgram WS
 *   main  --[audio:stop]-->   renderer sends CloseStream
 *   renderer --[transcript:partial/final]--> main injects text
 */
import { useEffect, useRef } from 'react'

const DG_URL  = 'wss://api.deepgram.com/v1/listen'
const PARAMS  = new URLSearchParams({
  model:           'nova-2',
  language:        'en-US',
  encoding:        'linear16',
  sample_rate:     '16000',
  channels:        '1',
  interim_results: 'true',
  punctuate:       'true',
  endpointing:     '800',
}).toString()

export default function DeepgramBridge () {
  const wsRef = useRef(null)

  useEffect(() => {
    const vf = window.voiceflow
    if (!vf) return

    // Main sends key → open WebSocket
    vf.onDeepgramKey((key) => {
      console.log('[DeepgramBridge] Got key, opening WS')
      if (wsRef.current) {
        try { wsRef.current.close() } catch {}
      }

      // Browser WebSocket has no custom headers — pass token as query param
      const ws = new WebSocket(`${DG_URL}?${PARAMS}&token=${key}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[DeepgramBridge] Connected')
        vf.sendPartial('__CONNECTED__')  // signal to main that WS is ready
      }

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          const text = data?.channel?.alternatives?.[0]?.transcript ?? ''
          if (!text) return

          if (data.speech_final) {
            console.log('[DeepgramBridge] Final:', text)
            vf.sendFinal(text)
          } else if (data.is_final === false) {
            vf.sendPartial(text)
          }
        } catch {}
      }

      ws.onerror = (e) => {
        console.error('[DeepgramBridge] WS error', e)
      }

      ws.onclose = (e) => {
        console.log('[DeepgramBridge] Closed', e.code)
        wsRef.current = null
      }
    })

    // Main sends audio chunks (arrive as Buffer — convert to ArrayBuffer)
    vf.onAudioChunk((chunk) => {
      const ws = wsRef.current
      if (ws?.readyState === WebSocket.OPEN) {
        const buf = chunk instanceof ArrayBuffer
          ? chunk
          : chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength)
        ws.send(buf)
      }
    })

    // Main signals stop
    vf.onAudioStop(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'CloseStream' }))
      }
    })
  }, [])

  return null
}
