import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface VoiceRecorderProps {
  onParsedProduct: (productData: any, transcript: string, audioUrl?: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onParsedProduct }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    setTranscript(null);
    setAudioBlob(null);
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone access denied or unavailable:', err);
      setError('Microphone access not available. You can use the "Test Demo Voice Note" below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const processAudio = async (blobToProcess?: Blob) => {
    const targetBlob = blobToProcess || audioBlob;
    if (!targetBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await api.uploadVoiceRecording(targetBlob);
      setTranscript(result.transcript);
      if (result.parsedProduct) {
        onParsedProduct(result.parsedProduct, result.transcript, result.audioUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed processing voice memo with Whisper / Gemini');
    } finally {
      setIsProcessing(false);
    }
  };

  const runDemoVoiceMemo = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // Create empty mock audio blob
      const demoBlob = new Blob(['demo-voice-memo-audio-stream'], { type: 'audio/webm' });
      await processAudio(demoBlob);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="ems-card p-6 border border-white/10 relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Whisper STT + Gemini 1.5 Auto-Parser
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Voice-to-Listing Generator</h3>
          <p className="text-sm text-zinc-400">
            Speak product details aloud (title, color/size variants, pricing, specs). AI automatically extracts, structures, and creates the Shopify listing.
          </p>
        </div>

        <button
          onClick={runDemoVoiceMemo}
          disabled={isRecording || isProcessing}
          className="px-3.5 py-2 text-xs font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Test Demo Voice Note
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          {error}
        </div>
      )}

      {/* Recording Console */}
      <div className="bg-[#030712]/80 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[180px]">
        {isRecording ? (
          <div className="flex flex-col items-center gap-4">
            {/* Dynamic Waveform Visualizer */}
            <div className="flex items-center gap-1.5 h-10">
              {[40, 70, 90, 50, 100, 60, 80, 45, 95, 75, 30, 85, 60].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-indigo-500 rounded-full wave-bar"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.08}s`
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-lg font-semibold text-white tracking-wider">
                {formatSeconds(recordingTime)}
              </span>
            </div>

            <button
              onClick={stopRecording}
              className="mt-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-medium text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop Recording
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Mic className="w-7 h-7" />
            </button>
            <span className="text-sm text-zinc-400 font-medium">
              Click microphone to start recording product memo
            </span>
          </div>
        )}

        {/* Audio review and submit */}
        {audioUrl && !isRecording && (
          <div className="mt-5 w-full max-w-md pt-4 border-t border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayback}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <span className="text-xs text-zinc-400 font-mono">
                  Recorded audio ({formatSeconds(recordingTime)})
                </span>
              </div>

              <button
                onClick={() => processAudio()}
                disabled={isProcessing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Transcribing & Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Listing from Audio
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="mt-5 p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Transcribed Audio Note (OpenAI Whisper):
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed italic">
            "{transcript}"
          </p>
        </div>
      )}
    </div>
  );
};
