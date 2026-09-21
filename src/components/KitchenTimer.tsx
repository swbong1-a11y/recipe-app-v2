import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Bell, X } from 'lucide-react';

interface KitchenTimerProps {
  initialMinutes?: number;
  onClose?: () => void;
}

export const KitchenTimer: React.FC<KitchenTimerProps> = ({
  initialMinutes = 15,
  onClose,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound chime using Web Audio API
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.6);
      });
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setHasFinished(true);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(totalSeconds);
      setHasFinished(false);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    setHasFinished(false);
  };

  const setPresetMinutes = (mins: number) => {
    setIsRunning(false);
    setTotalSeconds(mins * 60);
    setRemainingSeconds(mins * 60);
    setHasFinished(false);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  return (
    <div
      id="kitchen-timer-widget"
      className="bg-stone-900 text-stone-100 rounded-2xl p-4 shadow-xl border border-stone-800"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            {isRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-amber-400' : 'bg-stone-500'}`}></span>
          </span>
          <h4 className="text-sm font-semibold tracking-wide text-stone-200">15분 키친 타이머</h4>
        </div>
        {onClose && (
          <button
            id="close-timer-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1 rounded-lg transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center my-2">
        <div className={`text-4xl font-mono font-bold tracking-widest ${hasFinished ? 'text-amber-400 animate-pulse' : 'text-stone-100'}`}>
          {formatTime(remainingSeconds)}
        </div>
        {hasFinished && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1 font-medium">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>15분 요리가 완성되었습니다! 불을 끄세요!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden my-3">
        <div
          className="bg-amber-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Preset buttons */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {[5, 10, 15].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setPresetMinutes(m)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
              totalSeconds === m * 60
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            {m}분
          </button>
        ))}
      </div>

      {/* Action controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          id="toggle-timer-btn"
          type="button"
          onClick={toggleTimer}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm ${
            isRunning
              ? 'bg-stone-800 text-amber-400 hover:bg-stone-700'
              : 'bg-amber-500 text-stone-950 hover:bg-amber-400'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {isRunning ? '일시정지' : '타이머 시작'}
        </button>

        <button
          id="reset-timer-btn"
          type="button"
          onClick={resetTimer}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          초기화
        </button>
      </div>
    </div>
  );
};
