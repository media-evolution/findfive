export interface VoiceRecorderOptions {
  onTranscript?: (transcript: string) => void
  onError?: (error: string) => void
  onStart?: () => void
  onStop?: () => void
  lang?: string
  continuous?: boolean
  interimResults?: boolean
}

export class VoiceRecorder {
  private recognition: SpeechRecognition | null = null
  private isRecording = false
  private options: VoiceRecorderOptions
  private timeoutId: NodeJS.Timeout | null = null

  constructor(options: VoiceRecorderOptions = {}) {
    this.options = {
      lang: 'en-US',
      continuous: true,
      interimResults: true,
      ...options
    }
  }

  public isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  public async startRecording(): Promise<void> {
    if (!this.isSupported()) {
      this.options.onError?.('Speech recognition not supported in this browser')
      return
    }

    if (this.isRecording) {
      return
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      
      this.recognition.lang = this.options.lang!
      this.recognition.continuous = this.options.continuous!
      this.recognition.interimResults = this.options.interimResults!
      
      this.recognition.onstart = () => {
        this.isRecording = true
        this.options.onStart?.()
        
        // Auto-stop after 30 seconds
        this.timeoutId = setTimeout(() => {
          this.stopRecording()
        }, 30000)
      }
      
      this.recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          this.options.onTranscript?.(`${finalTranscript}${interimTranscript}`.trim())
        }
      }
      
      this.recognition.onerror = (event) => {
        this.isRecording = false
        this.options.onError?.(event.error)
        this.cleanup()
      }
      
      this.recognition.onend = () => {
        this.isRecording = false
        this.options.onStop?.()
        this.cleanup()
      }
      
      this.recognition.start()
    } catch (error) {
      this.options.onError?.(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  public stopRecording(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop()
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording
  }

  private cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}