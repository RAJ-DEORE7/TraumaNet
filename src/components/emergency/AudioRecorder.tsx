import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob, base64: string) => void;
  onTranscriptionComplete?: (transcript: string) => void;
  onCancel?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  onTranscriptionComplete,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscriptionError(null);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Real Audio Analyzer for live amplitude calculation
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (e) {
        console.warn('Audio analyzer initialization notice:', e);
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        stopTracks();

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          onAudioRecorded(blob, base64Data);

          // Attempt real transcription via server Gemini Transcribe API
          if (onTranscriptionComplete) {
            setIsTranscribing(true);
            try {
              const res = await fetch('/api/gemini/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Data, mimeType: 'audio/webm' }),
              });

              if (res.ok) {
                const data = await res.json();
                if (data.transcript) {
                  onTranscriptionComplete(data.transcript);
                } else {
                  setTranscriptionError('Speech-to-text service unavailable.');
                }
              } else {
                setTranscriptionError('Speech-to-text service unavailable.');
              }
            } catch {
              setTranscriptionError('Speech-to-text service unavailable.');
            } finally {
              setIsTranscribing(false);
            }
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(250); // Emit chunks every 250ms
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission was denied. Please allow microphone access in browser settings.');
      } else {
        setErrorMessage('Could not initialize microphone: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    stopTracks();
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsRecording(false);
    setDuration(0);
    setErrorMessage(null);
    setTranscriptionError(null);
    if (onCancel) onCancel();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-sm space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className={`w-4 h-4 ${isRecording ? 'text-red-600 animate-pulse' : 'text-neutral-600'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            {isRecording
              ? 'Recording Emergency Audio...'
              : audioBlob
              ? 'Audio Captured'
              : 'Voice Input'}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-neutral-700">
          {formatTime(duration)}
        </span>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Real Live Audio Level Visualizer */}
      {isRecording && (
        <div className="space-y-1.5 py-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Live Microphone Level</span>
            <span className="font-mono">{audioLevel}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
            <motion.div
              className="h-full bg-red-600 rounded-full"
              style={{ width: `${Math.max(5, audioLevel)}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 pt-1">
        {!isRecording && !audioBlob && (
          <button
            type="button"
            onClick={startRecording}
            className="flex-1 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Mic className="w-4 h-4" />
            <span>Record Voice Note</span>
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex-1 h-10 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Stop Recording</span>
          </button>
        )}

        {audioBlob && audioUrl && (
          <div className="flex-1 space-y-2">
            <audio src={audioUrl} controls className="w-full h-8" />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={resetRecording}
                className="h-8 px-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Re-record</span>
              </button>

              {isTranscribing ? (
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transcribing audio...</span>
                </div>
              ) : transcriptionError ? (
                <span className="text-[11px] text-amber-700 font-medium">
                  {transcriptionError}
                </span>
              ) : (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Audio Attached</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
