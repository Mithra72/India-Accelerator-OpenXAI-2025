"use client";

import { useRef, useState } from "react";

type Status = "idle" | "recording" | "uploading" | "done" | "error";

export default function VoiceRecorder() {
  const [status, setStatus] = useState<Status>("idle");
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      setTranscript(null);
      setError(null);
      setAudioURL(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorder.current = mr;
      audioChunks.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunks.current.push(e.data);
      };

      mr.onstop = async () => {
        // stop tracks so mic light turns off
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        setStatus("uploading");
        try {
          const fd = new FormData();
          fd.append("file", blob, "recording.webm");

          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          if (!res.ok) throw new Error(`Server error: ${res.status}`);
          const data = (await res.json()) as { text?: string; error?: string };

          if (data.error) throw new Error(data.error);
          setTranscript(data.text ?? "No transcription available.");
          setStatus("done");
        } catch (e: any) {
          setError(e?.message || "Upload failed.");
          setStatus("error");
        }
      };

      mr.start();
      setStatus("recording");
    } catch (e: any) {
      setError(e?.message || "Microphone permission denied.");
      setStatus("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    } else if (streamRef.current) {
      // safety: stop tracks if recorder failed to start
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const busy = status === "recording" || status === "uploading";

  return (
     <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={status === "recording" ? stopRecording : startRecording}
          className={`rounded-xl px-5 py-3 font-semibold text-white shadow transition
            ${status === "recording" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
          aria-label={status === "recording" ? "Stop recording" : "Start recording"}
        >
          {status === "recording" ? "Stop Recording" : "Start Recording"}
        </button>

        <span className="text-sm text-gray-600">
          Status:{" "}
          <strong className="capitalize">
            {status.replace("-", " ")}
          </strong>
        </span>
      </div>

      {audioURL && (
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Preview</p>
          <audio src={audioURL} controls className="w-full" />
        </div>
      )}

      {busy && (
        <div className="text-sm text-gray-600">Processing… this may take a moment.</div>
      )}

      {transcript && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-1 text-sm font-semibold text-emerald-900">Transcript</p>
          <p className="whitespace-pre-wrap text-emerald-950">{transcript}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
