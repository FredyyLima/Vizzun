import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AudioWaveformPlayerProps = {
  src: string;
  isMe?: boolean;
};

const BAR_COUNT = 48;

const formatTime = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const AudioWaveformPlayer = ({ src, isMe = false }: AudioWaveformPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const handleTime = () => setCurrentTime(audio.currentTime || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handlePause);

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handlePause);
    };
  }, [src]);

  useEffect(() => {
    let cancelled = false;
    const buildWaveform = async () => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const AudioContextConstructor =
          window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextConstructor();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const data = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(data.length / BAR_COUNT) || 1;
        const peaks = new Array(BAR_COUNT).fill(0).map((_, index) => {
          let sum = 0;
          const start = index * blockSize;
          for (let i = 0; i < blockSize; i += 1) {
            sum += Math.abs(data[start + i] ?? 0);
          }
          return sum / blockSize;
        });
        const max = Math.max(...peaks, 0.0001);
        const normalized = peaks.map((value) => value / max);
        if (!cancelled) setBars(normalized);
        audioContext.close();
      } catch (error) {
        console.warn("Nao foi possivel gerar a forma de onda:", error);
      }
    };

    if (src) {
      buildWaveform();
    }

    return () => {
      cancelled = true;
    };
  }, [src]);

  const progress = useMemo(() => (duration ? currentTime / duration : 0), [currentTime, duration]);
  const activeBars = Math.floor(progress * BAR_COUNT);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        console.warn("Nao foi possivel reproduzir o audio:", error);
      }
    } else {
      audio.pause();
    }
  };

  const baseColor = isMe ? "bg-primary-foreground/30" : "bg-muted-foreground/40";
  const activeColor = isMe ? "bg-primary-foreground" : "bg-primary";
  const timeColor = isMe ? "text-primary-foreground/80" : "text-muted-foreground";
  const buttonBg = isMe ? "bg-primary-foreground/20" : "bg-muted";
  const buttonIcon = isMe ? "text-primary-foreground" : "text-foreground";

  return (
    <div className="flex items-center gap-3 w-full">
      <button type="button" onClick={togglePlay} className={cn("h-9 w-9 rounded-full flex items-center justify-center", buttonBg)}>
        {isPlaying ? <Pause className={cn("h-4 w-4", buttonIcon)} /> : <Play className={cn("h-4 w-4", buttonIcon)} />}
      </button>
      <span className={cn("text-xs tabular-nums", timeColor)}>{formatTime(currentTime)}</span>
      <div className="flex-1 flex items-end gap-[2px] h-9">
        {(bars.length ? bars : new Array(BAR_COUNT).fill(0.2)).map((value, index) => (
          <span
            key={`bar-${index}`}
            className={cn("w-[3px] rounded-full", index <= activeBars ? activeColor : baseColor)}
            style={{ height: `${Math.max(4, value * 32)}px` }}
          />
        ))}
      </div>
      <span className={cn("text-xs tabular-nums", timeColor)}>{formatTime(duration)}</span>
    </div>
  );
};

export default AudioWaveformPlayer;
