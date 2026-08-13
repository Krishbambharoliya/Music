'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PLAYLISTS, Playlist, Track } from './tracks';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

// Module-level sub-components
const PlayIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const PrevIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);

const NextIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6zm9-12v12h2V6z" />
  </svg>
);

// Tabular numbers time formatter
const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Module-scope Clock sub-component
const Clock = () => {
  const [timeString, setTimeString] = useState({ hour: '12', minute: '00', ampm: 'AM' });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      const parts = formatter.formatToParts(now);
      let hour = '12';
      let minute = '00';
      let ampm = 'AM';
      for (const part of parts) {
        if (part.type === 'hour') hour = part.value;
        if (part.type === 'minute') minute = part.value;
        if (part.type === 'dayPeriod') ampm = part.value.toUpperCase();
      }
      setTimeString({ hour, minute, ampm });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center text-sm sm:text-base font-semibold text-cream/95 px-4.5 py-2 rounded-full border border-[#ebb548]/20 bg-[#16110e]/75 backdrop-blur-md select-none font-retro crt-glow-amber">
      <span className="font-bold text-brass mr-2">IST</span>
      <span className="tabular-nums">
        {timeString.hour}
        <span className="colon-blink mx-[2px] inline-block text-brass font-bold">:</span>
        {timeString.minute}
      </span>
      <span className="text-[11px] sm:text-xs text-cream/60 ml-2 font-bold tracking-wider">{timeString.ampm}</span>
    </div>
  );
};

const getDefaultPlaylistId = () => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false
    });
    const hour = parseInt(formatter.format(now), 10);
    
    if (hour >= 5 && hour < 9) return 'subah-ki-chai';
    if (hour >= 9 && hour < 18) return 'dopahar-ka-aaram';
    if (hour >= 18 && hour < 22) return 'shaam-ka-adda';
    return 'raat-ki-paali';
  } catch (e) {
    return 'dopahar-ka-aaram';
  }
};

export default function PlayerClient() {
  const [playlists, setPlaylists] = useState<Playlist[]>(PLAYLISTS);
  const [activePlaylistId, setActivePlaylistId] = useState(() => getDefaultPlaylistId());
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const playlist = playlists.find(p => p.id === activePlaylistId) || playlists[0];
  const currentTrack = playlist.tracks[trackIndex] || playlist.tracks[0];

  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;
  const trackIndexRef = useRef(trackIndex);
  trackIndexRef.current = trackIndex;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const refreshSongs = (selectLocal = false) => {
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        if (data.songs && data.songs.length > 0) {
          const localPlaylist: Playlist = {
            id: 'local-library',
            name: 'LOCAL',
            tracks: data.songs
          };
          const updated = PLAYLISTS.map(pl => {
            if (pl.id === 'raat-ki-paali') return { ...pl, name: 'NIGHT' };
            if (pl.id === 'subah-ki-chai') return { ...pl, name: 'CHAI' };
            if (pl.id === 'dopahar-ka-aaram') return { ...pl, name: 'REST' };
            if (pl.id === 'shaam-ka-adda') return { ...pl, name: 'ADDA' };
            return pl;
          });
          setPlaylists([localPlaylist, ...updated]);
          if (selectLocal) {
            setActivePlaylistId('local-library');
          }
        } else {
          setPlaylists(PLAYLISTS.map(pl => {
            if (pl.id === 'raat-ki-paali') return { ...pl, name: 'NIGHT' };
            if (pl.id === 'subah-ki-chai') return { ...pl, name: 'CHAI' };
            if (pl.id === 'dopahar-ka-aaram') return { ...pl, name: 'REST' };
            if (pl.id === 'shaam-ka-adda') return { ...pl, name: 'ADDA' };
            return pl;
          }));
        }
      })
      .catch(err => {
        console.warn('Local audio files fetch skipped/warning:', err);
      });
  };

  useEffect(() => {
    refreshSongs(true);
  }, []);

  const handleUpload = async (fileToUpload: File) => {
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const res = await fetch('/api/songs/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadSuccess(true);
        setSelectedFile(null);
        refreshSongs(false);

        // Automatically close after success animation
        setTimeout(() => {
          setIsUploadOpen(false);
          setUploadSuccess(false);
        }, 1500);
      } else {
        setUploadError(data.error || 'Failed to upload song');
      }
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const playNext = () => {
    if (playlistRef.current.tracks.length === 0) return;
    const nextIndex = (trackIndexRef.current + 1) % playlistRef.current.tracks.length;
    setTrackIndex(nextIndex);
    setElapsed(0);
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (playlistRef.current.tracks.length === 0) return;
    const prevIndex = (trackIndexRef.current - 1 + playlistRef.current.tracks.length) % playlistRef.current.tracks.length;
    setTrackIndex(prevIndex);
    setElapsed(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    
    const isLocal = !!currentTrack.fileName;
    if (isLocal && audioRef.current) {
      if (nextPlaying) {
        audioRef.current.play().catch(err => console.warn(err));
      } else {
        audioRef.current.pause();
      }
    } else if (playerRef.current) {
      if (nextPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  };

  const handlePlaylistChange = (newPlaylist: Playlist) => {
    setActivePlaylistId(newPlaylist.id);
    setTrackIndex(0);
    setElapsed(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!isSeeking && audioRef.current) {
        setElapsed(audioRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration || currentTrackRef.current.duration);
      }
    };

    const handleEnded = () => {
      playNext();
    };

    const handleError = (e: any) => {
      console.warn("Local audio error playback, skipping:", e);
      playNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => {};
    }

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let player: any;
    const checkAndInit = () => {
      if (window.YT && window.YT.Player && containerRef.current) {
        player = new window.YT.Player(containerRef.current, {
          videoId: currentTrackRef.current.videoId || 'bM7SZ5SBzyY',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              playerRef.current = event.target;
              setIsPlayerReady(true);
              
              if (!currentTrackRef.current.fileName) {
                setDuration(event.target.getDuration() || currentTrackRef.current.duration);
              }
            },
            onStateChange: (event: any) => {
              if (!!currentTrackRef.current.fileName) return;

              const state = event.data;
              if (state === 1) {
                setIsPlaying(true);
              } else if (state === 2) {
                setIsPlaying(false);
              } else if (state === 0) {
                playNext();
              }
            },
            onError: (event: any) => {
              if (!!currentTrackRef.current.fileName) return;
              
              console.warn("YouTube Player error:", event.data);
              playNext();
              
              try {
                import('@vercel/analytics').then(({ track }) => {
                  track('YouTubePlayerError', {
                    code: event.data,
                    videoId: currentTrackRef.current.videoId,
                  });
                });
              } catch (err) {
                console.error(err);
              }
            }
          }
        });
      } else {
        setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();

    return () => {
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    const isLocal = !!currentTrack.fileName;

    if (isLocal) {
      if (isPlayerReady && playerRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          console.warn(e);
        }
      }

      const targetSrc = currentTrack.filePath || `/api/stream?file=${encodeURIComponent(currentTrack.fileName || '')}`;
      const absoluteTargetSrc = window.location.origin + targetSrc;

      if (audioRef.current.src !== absoluteTargetSrc) {
        audioRef.current.src = targetSrc;
        audioRef.current.load();
      }

      if (isPlaying) {
        audioRef.current.play().catch(err => console.warn("Audio play failed:", err));
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.pause();

      if (isPlayerReady && playerRef.current) {
        const currentVideoId = playerRef.current.getVideoData()?.video_id;
        if (currentVideoId !== currentTrack.videoId && currentTrack.videoId) {
          if (isPlaying) {
            playerRef.current.loadVideoById({ videoId: currentTrack.videoId });
          } else {
            playerRef.current.cueVideoById({ videoId: currentTrack.videoId });
          }
        } else {
          const playerState = playerRef.current.getPlayerState();
          if (isPlaying && playerState !== 1) {
            playerRef.current.playVideo();
          } else if (!isPlaying && playerState === 1) {
            playerRef.current.pauseVideo();
          }
        }
      }
    }
  }, [currentTrack, isPlaying, isPlayerReady]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const isLocal = !!currentTrack.fileName;

    if (isPlaying && !isSeeking && !isLocal) {
      timer = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const current = playerRef.current.getCurrentTime();
          setElapsed(current);
          const dur = playerRef.current.getDuration();
          if (dur && dur !== duration) {
            setDuration(dur);
          }
        }
      }, 250);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, isSeeking, duration, currentTrack]);

  // Synchronize volume across HTML5 Audio and YouTube
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (isPlayerReady && playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(Math.round(volume * 100));
      } catch (e) {
        console.warn("Error setting YouTube volume:", e);
      }
    }
  }, [volume, isPlayerReady, currentTrack]);

  const seekContainerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!seekContainerRef.current) return;
    setIsSeeking(true);
    seekContainerRef.current.setPointerCapture(e.pointerId);
    handleSeekUpdate(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSeeking) return;
    handleSeekUpdate(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSeeking) return;
    setIsSeeking(false);
    
    if (seekContainerRef.current) {
      seekContainerRef.current.releasePointerCapture(e.pointerId);
      
      const rect = seekContainerRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
      const targetTime = pct * duration;

      const isLocal = !!currentTrack.fileName;
      if (isLocal && audioRef.current) {
        audioRef.current.currentTime = targetTime;
        setElapsed(targetTime);
      } else if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(targetTime, true);
        setElapsed(targetTime);
      }
    }
  };

  const handleSeekUpdate = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!seekContainerRef.current) return;
    const rect = seekContainerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    setElapsed(pct * duration);
  };

  const progressPct = duration > 0 ? (elapsed / duration) * 100 : 0;

  return (
    <>
      {/* FIXED TOP ROW */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 pointer-events-none">
        <div className="pointer-events-auto safe-m-t safe-m-l">
          <Clock />
        </div>
      </header>

      {/* Hidden YouTube player container */}
      <div className="fixed -top-[500px] -left-[500px] w-1 h-1 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
        <div ref={containerRef} id="yt-player-iframe" />
      </div>

      {/* ═══════════════════════════════════════════
          COMPACT HORIZONTAL PHILIPS RADIO (BOTTOM ANCHORED)
          ═══════════════════════════════════════════ */}
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30 w-full max-w-xl sm:max-w-2xl px-4 pointer-events-none" id="player-wrapper">
        
        {/* Mechanical buttons - extremely compact, positioned right above the panel */}
        <div className="flex gap-1.5 justify-center pointer-events-auto font-retro text-[8px] mb-[1px]" id="playlist-tabs">
          {playlists.map((pl) => {
            const isActive = activePlaylistId === pl.id;
            return (
              <button
                key={pl.id}
                onClick={() => handlePlaylistChange(pl)}
                className={`h-5 sm:h-6 text-[7px] sm:text-[7.5px] font-bold font-retro uppercase rounded-t-[4px] cursor-pointer select-none border-t border-x transition-all duration-300 ease-in-out origin-bottom ${
                  isUploadOpen
                    ? "w-0 opacity-0 scale-90 pointer-events-none mx-0 px-0 border-none overflow-hidden"
                    : "w-10 sm:w-12 px-1 mx-[0.5px] opacity-100 scale-100"
                } ${
                  isActive
                    ? "bg-[#d8cbb0] text-[#50370d] border-t-[4px] border-t-stone-700 border-x border-stone-400 shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] translate-y-[2px]"
                    : "bg-gradient-to-b from-[#f7ebd3] to-[#e6d8be] text-[#6b4c1b] border-t border-x border-[#c2b59b] hover:from-[#fff7eb] hover:to-[#ebdcb9] shadow-[0_2px_4px_rgba(0,0,0,0.4)] active:translate-y-[1px] active:shadow-inner"
                }`}
                style={{
                  textShadow: isActive ? 'none' : '0 0.5px 0.5px rgba(255,255,255,0.8)'
                }}
              >
                {!isUploadOpen && pl.name}
              </button>
            );
          })}

          {/* The Upload/Add Key */}
          <button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className={`h-5 sm:h-6 text-[7px] sm:text-[7.5px] font-bold font-retro uppercase rounded-t-[4px] cursor-pointer select-none transition-all duration-300 ease-in-out border-t border-x ${
              isUploadOpen
                ? "w-12 sm:w-14 bg-[#c8102e] text-white border-t-[4px] border-t-red-950 border-x-[#9e0d25] shadow-[inset_0_3px_6px_rgba(0,0,0,0.5)] translate-y-[2px]"
                : "w-10 sm:w-12 bg-gradient-to-b from-[#e66050] to-[#c8102e] text-white border-[#9e0d25] hover:from-[#f47364] hover:to-[#b00d28] shadow-[0_2px_4px_rgba(0,0,0,0.4)] active:translate-y-[1px] active:shadow-inner"
            }`}
          >
            {isUploadOpen ? "CANCEL" : "+ ADD"}
          </button>
        </div>

        {/* Animated Slide Drawer (Cassette/Tape Slot compartment) */}
        <div
          className={`w-full overflow-hidden transition-all duration-500 ease-in-out pointer-events-auto ${
            isUploadOpen ? "max-h-[160px] opacity-100 mb-1.5" : "max-h-0 opacity-0 mb-0"
          }`}
        >
          <div
            className="w-full p-3 rounded-xl border-[3px] border-[#50370d] text-cream shadow-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #1b1610 0%, #100d0a 100%)",
            }}
          >
            <div className="absolute inset-0.5 rounded-lg border border-[#ebb548]/10 pointer-events-none" />

            <div className="flex flex-col gap-2 relative z-10 font-retro">
              <div className="flex justify-between items-center text-[8.5px] sm:text-[10px] text-brass font-bold uppercase tracking-wider select-none border-b border-[#ebb548]/20 pb-1">
                <span>LOCAL CASSETTE LOADER</span>
                {uploading && (
                  <span className="flex items-center gap-1 text-[#c8102e] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c8102e]" />
                    REC
                  </span>
                )}
              </div>

              {uploadSuccess ? (
                <div className="flex flex-col items-center justify-center py-4 text-emerald-400 font-bold select-none text-[10px] sm:text-xs">
                  <span className="text-[16px] mb-1">✓</span>
                  <span>TAPE LOADED SUCCESSFULLY!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#ebb548]/30 rounded-lg py-3 px-2 bg-black/40 hover:bg-black/60 hover:border-[#ebb548]/60 cursor-pointer transition-all duration-150">
                      <span className="text-[8.5px] sm:text-[10px] text-cream/70 font-semibold truncate max-w-[200px] sm:max-w-[260px]">
                        {selectedFile ? selectedFile.name : "CHOOSE AUDIO FILE (MP3, WAV, M4A, OGG)"}
                      </span>
                      <span className="text-[6.5px] sm:text-[7.5px] text-brass mt-1">SAVES TO INTERNAL DATABASE (public/songs)</span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                      />
                    </label>

                    <button
                      disabled={uploading || !selectedFile}
                      onClick={() => selectedFile && handleUpload(selectedFile)}
                      className={`px-3 py-2 text-[8px] sm:text-[9px] font-bold uppercase rounded-md shadow-md border cursor-pointer transition-all ${
                        selectedFile && !uploading
                          ? "bg-gradient-to-b from-[#ebb548] to-[#bd8c25] text-[#382504] border-[#a67c22] hover:scale-103 active:scale-97"
                          : "bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed"
                      }`}
                    >
                      {uploading ? "RECORDING..." : "LOAD TAPE"}
                    </button>
                  </div>

                  {uploadError && (
                    <div className="text-[#c8102e] text-[7.5px] sm:text-[8.5px] font-bold text-center leading-none mt-1 select-none">
                      ERROR: {uploadError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The Radio Body */}
        <div
          className="pointer-events-auto w-full rounded-[22px] border-[5px] border-[#50370d] relative overflow-hidden select-none shadow-[0_12px_40px_rgba(0,0,0,0.75)]"
          style={{
            background: 'linear-gradient(180deg, #dcae44 0%, #bd8c25 50%, #875e0c 100%)',
          }}
        >
          {/* Gold highlight wire */}
          <div className="w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)' }} />

          <div className="w-full px-3 py-1.5 sm:py-2 flex items-center justify-between gap-3">
            
            {/* 2. Track Title & Artist (Compact list) */}
            <div className="flex flex-col justify-center min-w-0 max-w-[100px] sm:max-w-[140px] text-left select-none shrink-0 leading-none">
              <span className="text-[9.5px] sm:text-[11px] font-semibold text-cream truncate font-retro drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {currentTrack.title}
              </span>
              <span className="text-[7.5px] sm:text-[8px] text-brass font-bold uppercase truncate font-retro mt-[3px] drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.9)]">
                {currentTrack.artist}
              </span>
            </div>

            {/* 3. Glass Dial Seek Bar (Center) */}
            <div className="flex-1 h-9 select-none relative">
              <div
                ref={seekContainerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="h-full w-full relative rounded-md border border-[#50370d] bg-[#070b13] overflow-hidden cursor-pointer touch-none shadow-inner"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,161,58,0.25)_0%,transparent_80%)]" />

                {/* Gold scales */}
                <div className="absolute inset-0 px-2 py-1 flex flex-col justify-between font-retro text-[6.5px] sm:text-[7.5px] text-[#ebb548]/95 font-bold opacity-85 pointer-events-none">
                  <div className="flex justify-between tracking-wide leading-none">
                    <span>DELHI</span>
                    <span>KOLKATA</span>
                    <span>MUMBAI</span>
                    <span>MADRAS</span>
                  </div>
                  <div className="flex justify-between text-[5.5px] sm:text-[6.5px] text-[#ebb548]/45 leading-none">
                    <span>550</span>
                    <span>700</span>
                    <span>900</span>
                    <span>1200</span>
                    <span>1600</span>
                  </div>
                </div>

                {/* Red needle */}
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#c8102e]"
                  style={{
                    left: `${progressPct}%`,
                    boxShadow: '0 0 5px #c8102e, 0 0 1.5px #c8102e',
                    transition: isSeeking ? 'none' : 'left 0.25s linear',
                  }}
                />
              </div>
            </div>

            {/* 4. Knob 0: Prev */}
            <div className="shrink-0 flex flex-col items-center">
              <button
                onClick={playPrev}
                className="w-9 h-9 rounded-full relative cursor-pointer hover:scale-105 active:scale-90 active:-rotate-45 hover:border-[#ebb548] transition-all duration-300 ease-out"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #fff 15%, #f4eede 35%, #cfc5aa 70%, #7c745e 100%)',
                  border: '3px solid #50370d',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.65), inset 0 0.5px 1px rgba(255,255,255,1)',
                }}
                title="Previous Track"
              >
                <div className="absolute inset-[6px] rounded-full bg-[#50370d] flex items-center justify-center shadow-inner">
                  <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-[#fcd979] rounded-full" />
                  <PrevIcon className="w-2.5 h-2.5 text-[#fcd979]" />
                </div>
              </button>
            </div>

            {/* 5. Knob 1: Vol/Play */}
            <div className="shrink-0 flex flex-col items-center">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full relative cursor-pointer hover:scale-105 active:scale-90 hover:border-[#ebb548] transition-all duration-300 ease-out"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #fff 15%, #f4eede 35%, #cfc5aa 70%, #7c745e 100%)',
                  border: '3px solid #50370d',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.65), inset 0 0.5px 1px rgba(255,255,255,1)',
                  transform: isPlaying ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s, box-shadow 0.2s, scale 0.2s',
                }}
                title={isPlaying ? "Pause" : "Play"}
              >
                <div className="absolute inset-[6px] rounded-full bg-[#50370d] flex items-center justify-center shadow-inner">
                  <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-[#fcd979] rounded-full" />
                  {isPlaying ? <PauseIcon className="w-2.5 h-2.5 text-[#fcd979]" /> : <PlayIcon className="w-2.5 h-2.5 text-[#fcd979]" />}
                </div>
              </button>
            </div>

            {/* 6. Knob 2: Tune/Next */}
            <div className="shrink-0 flex flex-col items-center">
              <button
                onClick={playNext}
                className="w-9 h-9 rounded-full relative cursor-pointer hover:scale-105 active:scale-90 active:rotate-45 hover:border-[#ebb548] transition-all duration-300 ease-out"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #fff 15%, #f4eede 35%, #cfc5aa 70%, #7c745e 100%)',
                  border: '3px solid #50370d',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.65), inset 0 0.5px 1px rgba(255,255,255,1)',
                }}
                title="Next Track (Tune)"
              >
                <div className="absolute inset-[6px] rounded-full bg-[#50370d] flex items-center justify-center shadow-inner">
                  <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-[#fcd979] rounded-full" />
                  <NextIcon className="w-2.5 h-2.5 text-[#fcd979]" />
                </div>
              </button>
            </div>

            {/* Volume Up/Down Panel */}
            <div className="shrink-0 flex items-center gap-1.5 bg-[#080a0f] px-2 py-0.5 rounded-full border border-[#ebb548]/20 shadow-[inset_0_1.5px_3.5px_rgba(0,0,0,0.85)] select-none pointer-events-auto">
              <button
                onClick={() => setVolume(v => Math.max(0, parseFloat((v - 0.1).toFixed(1))))}
                className="w-4 h-4 rounded-full relative cursor-pointer active:scale-90 transition-all"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #fcd979, #cf9c2b 60%, #69480d 100%)',
                  border: '1.5px solid #50370d',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.6), inset 0 0.5px 0.5px rgba(255,255,255,0.4)'
                }}
                title="Volume Down"
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-2 h-[1px] bg-[#50370d] transform rotate-45" />
                </div>
              </button>
              
              <span className="font-retro text-[7px] sm:text-[7.5px] text-[#ebb548] font-bold min-w-[16px] sm:min-w-[20px] text-center tracking-tighter">
                {Math.round(volume * 100)}
              </span>

              <button
                onClick={() => setVolume(v => Math.min(1.0, parseFloat((v + 0.1).toFixed(1))))}
                className="w-4 h-4 rounded-full relative cursor-pointer active:scale-90 transition-all"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #fcd979, #cf9c2b 60%, #69480d 100%)',
                  border: '1.5px solid #50370d',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.6), inset 0 0.5px 0.5px rgba(255,255,255,0.4)'
                }}
                title="Volume Up"
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-2 h-[1px] bg-[#50370d] transform -rotate-45" />
                  <div className="w-[1px] h-2 bg-[#50370d] transform -rotate-45 absolute" />
                </div>
              </button>
            </div>

            {/* 7. Elapsed time readout (right corner) */}
            <div className="text-right shrink-0 select-none leading-none font-retro font-bold text-[#ebb548]/90 text-[8px] sm:text-[9.5px]">
              <div>{formatTime(elapsed)}</div>
              <div className="text-[6.5px] text-cream/35 font-normal mt-[3px]">{formatTime(duration)}</div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
