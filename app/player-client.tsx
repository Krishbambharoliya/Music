'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PLAYLISTS, Playlist, Track } from './tracks';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export interface Background {
  id: string;
  name: string;
  url: string;
  tallUrl: string;
  isDefault?: boolean;
}

export const RADIO_COLORS: Record<string, { name: string; background: string; borderClass: string; previewBg: string }> = {
  ochre: {
    name: 'Ochre Gold',
    background: 'linear-gradient(180deg, #dcae44 0%, #bd8c25 50%, #875e0c 100%)',
    borderClass: 'border-[#50370d]',
    previewBg: '#bd8c25'
  },
  racing_green: {
    name: 'Racing Green',
    background: 'linear-gradient(180deg, #1e3c2b 0%, #12281c 50%, #07120c 100%)',
    borderClass: 'border-[#030904]',
    previewBg: '#12281c'
  },
  navy: {
    name: 'Navy Blue',
    background: 'linear-gradient(180deg, #1e2c45 0%, #121c2d 50%, #080e1a 100%)',
    borderClass: 'border-[#03060c]',
    previewBg: '#121c2d'
  },
  cognac: {
    name: 'Cognac Tan',
    background: 'linear-gradient(180deg, #a66a38 0%, #804c22 50%, #522d10 100%)',
    borderClass: 'border-[#301907]',
    previewBg: '#804c22'
  },
  burgundy: {
    name: 'Burgundy',
    background: 'linear-gradient(180deg, #702030 0%, #4d121e 50%, #29040c 100%)',
    borderClass: 'border-[#190206]',
    previewBg: '#4d121e'
  },
  champagne: {
    name: 'Champagne',
    background: 'linear-gradient(180deg, #f3ece0 0%, #ded5c2 50%, #bcae97 100%)',
    borderClass: 'border-[#665a46]',
    previewBg: '#ded5c2'
  },
  walnut: {
    name: 'Mahogany Wood',
    background: 'linear-gradient(180deg, #78482b 0%, #54301a 50%, #30170a 100%)',
    borderClass: 'border-[#1b0a03]',
    previewBg: '#54301a'
  },
  seafoam: {
    name: 'Seafoam Green',
    background: 'linear-gradient(180deg, #8cb5b3 0%, #689290 50%, #446664 100%)',
    borderClass: 'border-[#2c4241]',
    previewBg: '#689290'
  }
};

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
const Clock = ({ onClick }: { onClick?: () => void }) => {
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
    <button
      onClick={onClick}
      className="flex items-center text-xs sm:text-sm md:text-base font-semibold text-cream/95 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-[8px] border-t border-x border-[#50370d] bg-gradient-to-b from-[#2e261f] to-[#1c1611] select-none font-retro shadow-[0_3px_6px_rgba(0,0,0,0.6),inset_0_0.5px_0.5px_rgba(255,255,255,0.15)] hover:from-[#3a3027] hover:to-[#221b14] active:translate-y-[1.5px] active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.7)] transition-all duration-150 cursor-pointer"
      title="Click to Change Background"
    >
      <span className="font-bold text-[#ebb548] mr-1.5 sm:mr-2 select-none">IST</span>
      <span className="tabular-nums select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {timeString.hour}
        <span className="colon-blink mx-[2px] inline-block text-[#ebb548] font-bold">:</span>
        {timeString.minute}
      </span>
      <span className="text-[9px] sm:text-[11px] md:text-xs text-cream/50 ml-1.5 sm:ml-2 font-bold tracking-wider select-none">{timeString.ampm}</span>
    </button>
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
    
    if (hour >= 5 && hour < 9) return 'chai';
    if (hour >= 9 && hour < 18) return 'rest';
    if (hour >= 18 && hour < 22) return 'adda';
    return 'night';
  } catch (e) {
    return 'rest';
  }
};

export default function PlayerClient() {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const localPlaylist: Playlist = {
      id: 'local-library',
      name: 'LOCAL',
      tracks: []
    };
    return [localPlaylist, ...PLAYLISTS];
  });
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
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadPlaylist, setUploadPlaylist] = useState('local-library');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background images state
  const [backgrounds, setBackgrounds] = useState<Background[]>([
    { id: 'default', name: 'Engineering Building', url: '/bg/engineering.jpg', tallUrl: '/bg/engineering.jpg', isDefault: true }
  ]);
  const [activeBgId, setActiveBgId] = useState('default');
  const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [bgUploadError, setBgUploadError] = useState('');
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [radioColorId, setRadioColorId] = useState('ochre');

  const [isMobile, setIsMobile] = useState(false);

  // Computeds for backgrounds
  const activeBg = backgrounds.find(bg => bg.id === activeBgId) || backgrounds[0] || { url: '/bg/engineering.jpg', tallUrl: '/bg/engineering.jpg' };
  const currentBgUrl = isMobile && activeBg.tallUrl ? activeBg.tallUrl : activeBg.url;

  const [bgFade, setBgFade] = useState({
    activeUrl: currentBgUrl,
    overlayUrl: currentBgUrl,
    opacity: 1,
  });

  // Custom playlist names (persisted in localStorage)
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Load custom names and active background on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sp-playlist-names');
      if (saved) setCustomNames(JSON.parse(saved));
    } catch (e) { /* ignore */ }

    try {
      const savedBg = localStorage.getItem('sp-active-bg');
      if (savedBg) setActiveBgId(savedBg);
    } catch (e) { /* ignore */ }

    try {
      const savedColor = localStorage.getItem('sp-radio-color');
      if (savedColor) setRadioColorId(savedColor);
    } catch (e) { /* ignore */ }

    // Fetch backgrounds from API
    refreshBackgrounds();

    // Service Worker registration for PWA
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('PWA ServiceWorker active with scope:', reg.scope))
        .catch((err) => console.warn('PWA ServiceWorker registration failed:', err));
    }

    // Orientation checker
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (currentBgUrl !== bgFade.overlayUrl) {
      setBgFade(prev => ({
        activeUrl: prev.overlayUrl,
        overlayUrl: currentBgUrl,
        opacity: 0
      }));

      const animFrame = requestAnimationFrame(() => {
        setBgFade(prev => ({
          ...prev,
          opacity: 1
        }));
      });

      const timer = setTimeout(() => {
        setBgFade({
          activeUrl: currentBgUrl,
          overlayUrl: currentBgUrl,
          opacity: 1
        });
      }, 700);

      return () => {
        cancelAnimationFrame(animFrame);
        clearTimeout(timer);
      };
    }
  }, [currentBgUrl]);

  const refreshBackgrounds = () => {
    fetch('/api/backgrounds')
      .then(res => res.json())
      .then(data => {
        if (data.backgrounds) {
          setBackgrounds(data.backgrounds);
        }
      })
      .catch(err => console.warn('Error fetching backgrounds:', err));
  };

  const handleBgUpload = async (file: File) => {
    setUploadingBg(true);
    setBgUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/backgrounds/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackgrounds(data.backgrounds);
        const newBg = data.backgrounds[data.backgrounds.length - 1];
        if (newBg) {
          setActiveBgId(newBg.id);
          try { localStorage.setItem('sp-active-bg', newBg.id); } catch(e){}
        }
      } else {
        setBgUploadError(data.error || 'Failed to upload background');
      }
    } catch (err: any) {
      setBgUploadError(err.message || 'An error occurred during upload');
    } finally {
      setUploadingBg(false);
    }
  };

  const handleBgDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/backgrounds?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackgrounds(data.backgrounds);
        if (activeBgId === id) {
          setActiveBgId('default');
          try { localStorage.setItem('sp-active-bg', 'default'); } catch(e){}
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to get display name for a playlist
  const getPlaylistName = (pl: Playlist) => customNames[pl.id] || pl.name;

  const handleRenameSubmit = (playlistId: string, newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && trimmed.length <= 8) {
      const updated = { ...customNames, [playlistId]: trimmed.toUpperCase() };
      setCustomNames(updated);
      try { localStorage.setItem('sp-playlist-names', JSON.stringify(updated)); } catch (e) { /* ignore */ }
    }
    setEditingPlaylistId(null);
  };

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
        const uploadedSongs = data.songs || [];
        
        // Merge uploaded songs into their respective playlists
        const merged = PLAYLISTS.map(pl => {
          const uploadedForThis = uploadedSongs.filter((s: any) => s.playlist === pl.id);
          return {
            ...pl,
            tracks: [...pl.tracks, ...uploadedForThis],
          };
        });

        // Songs with no matching playlist or specifically for 'local-library'
        const localSongs = uploadedSongs.filter((s: any) => s.playlist === 'local-library' || !PLAYLISTS.some(pl => pl.id === s.playlist));
        
        const localPlaylist: Playlist = {
          id: 'local-library',
          name: 'LOCAL',
          tracks: localSongs,
        };

        setPlaylists([localPlaylist, ...merged]);
      })
      .catch(err => {
        console.warn('Local audio files fetch skipped/warning:', err);
        // Fallback
        const localPlaylist: Playlist = {
          id: 'local-library',
          name: 'LOCAL',
          tracks: [],
        };
        setPlaylists([localPlaylist, ...PLAYLISTS]);
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
    formData.append('playlist', uploadPlaylist);

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
          // Switch to the playlist we just added to
          setActivePlaylistId(uploadPlaylist);
          setTrackIndex(0);
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

  const handleDeleteSong = async (songId: string) => {
    if (!confirm("Are you sure you want to permanently delete this song?")) return;
    try {
      const res = await fetch(`/api/songs?id=${songId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (currentTrack && currentTrack.id === songId) {
          setIsPlaying(false);
          if (audioRef.current) {
            audioRef.current.pause();
          }
          if (playerRef.current) {
            playerRef.current.pauseVideo();
          }
          setTrackIndex(0);
          setElapsed(0);
        }
        refreshSongs(false);
      } else {
        alert(data.error || "Failed to delete song");
      }
    } catch (e) {
      console.error("Delete song error:", e);
      alert("Error deleting song");
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

  const activeColor = RADIO_COLORS[radioColorId] || RADIO_COLORS.ochre;

  return (
    <>
      {/* Background Layer 1: Underlying base image */}
      <div 
        className="fixed inset-0 -z-25 bg-cover bg-center bg-no-repeat" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.35), transparent, rgba(0, 0, 0, 0.8)), url(${bgFade.activeUrl})` 
        }} 
        aria-hidden="true" 
      />
      {/* Background Layer 2: Overlay fade-in image */}
      <div 
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out" 
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.35), transparent, rgba(0, 0, 0, 0.8)), url(${bgFade.overlayUrl})`,
          opacity: bgFade.opacity
        }} 
        aria-hidden="true" 
      />
      <div className="fixed inset-0 -z-10 grain-overlay pointer-events-none" aria-hidden="true" />

      {/* FIXED TOP ROW */}
      <header className="fixed top-0 left-0 right-0 z-45 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 pointer-events-none">
        <div className="pointer-events-auto safe-m-t safe-m-l relative">
          <Clock onClick={() => setIsBgPickerOpen(!isBgPickerOpen)} />
          
          {/* Background Picker Album Dropdown */}
          {isBgPickerOpen && (
            <div className="absolute top-full left-0 mt-2.5 z-50 w-72 sm:w-80 bg-gradient-to-b from-[#2e261f] to-[#1c1611] border-[3px] border-[#50370d] rounded-xl p-3 shadow-[0_8px_35px_rgba(0,0,0,0.95)] font-retro text-cream pointer-events-auto animate-drop-in">
              <div className="flex justify-between items-center border-b border-[#ebb548]/20 pb-1.5 mb-2 select-none text-[8.5px] sm:text-[10px] text-brass font-bold uppercase tracking-wider">
                <span>SELECT BACKGROUND (MAX 12)</span>
                <button 
                  onClick={() => setIsBgPickerOpen(false)}
                  className="hover:text-white cursor-pointer px-1 text-[10px]"
                >
                  ✕
                </button>
              </div>

              {/* Upload Input */}
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBgUpload(file);
                }}
              />

              <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[190px] pr-1 scrollbar-thin">
                {/* Available backgrounds */}
                {backgrounds.map((bg) => {
                  const isActive = bg.id === activeBgId;
                  return (
                    <div 
                      key={bg.id}
                      onClick={() => {
                        setActiveBgId(bg.id);
                        try { localStorage.setItem('sp-active-bg', bg.id); } catch(e){}
                      }}
                      className={`relative aspect-video rounded-md border overflow-hidden cursor-pointer group transition-all duration-200 ${
                        isActive 
                          ? 'border-[#ebb548] ring-1 ring-[#ebb548]/40 scale-[1.03]' 
                          : 'border-[#50370d]/50 hover:border-[#ebb548]/60 hover:scale-[1.01]'
                      }`}
                    >
                      <img 
                        src={bg.url} 
                        alt={bg.name}
                        className="w-full h-full object-cover select-none"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
                      
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 py-0.5 px-1 text-[6px] sm:text-[7px] font-semibold truncate select-none text-cream/90 leading-tight text-center uppercase">
                        {bg.name}
                      </div>

                      {/* Delete option for user uploaded backgrounds */}
                      {!bg.isDefault && (
                        <button
                          onClick={(e) => handleBgDelete(bg.id, e)}
                          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-black/80 hover:bg-[#c8102e] text-white text-[7px] flex items-center justify-center rounded-full border border-white/10 transition-colors cursor-pointer select-none"
                          title="Delete background"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add new background grid cell */}
                {backgrounds.length < 12 && (
                  <button
                    onClick={() => bgFileInputRef.current?.click()}
                    disabled={uploadingBg}
                    className="aspect-video rounded-md border border-dashed border-[#ebb548]/30 hover:border-[#ebb548]/60 bg-black/40 hover:bg-black/60 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-150 select-none"
                  >
                    {uploadingBg ? (
                      <span className="text-[6.5px] sm:text-[7.5px] text-brass animate-pulse">UP...</span>
                    ) : (
                      <>
                        <span className="text-brass text-[13px] leading-none">+</span>
                        <span className="text-[6px] sm:text-[7px] text-cream/70 font-semibold tracking-tight uppercase">ADD IMAGE</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {bgUploadError && (
                <div className="text-[#c8102e] text-[7.5px] font-bold text-center mt-2 select-none leading-tight">
                  ERROR: {bgUploadError}
                </div>
              )}

              {/* Radio Cabinet Color customizer */}
              <div className="border-t border-[#ebb548]/20 mt-3 pt-3">
                <div className="text-[8.5px] sm:text-[10px] text-brass font-bold uppercase tracking-wider mb-2 select-none">
                  RADIO CABINET COLOR
                </div>
                <div className="flex gap-2.5 items-center justify-start flex-wrap">
                  {Object.entries(RADIO_COLORS).map(([id, color]) => {
                    const isActive = radioColorId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setRadioColorId(id);
                          try { localStorage.setItem('sp-radio-color', id); } catch(e){}
                        }}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-all duration-200 border relative flex items-center justify-center ${
                          isActive 
                            ? 'border-[#ebb548] ring-2 ring-[#ebb548]/40 scale-110 shadow-lg' 
                            : 'border-stone-700 hover:border-[#ebb548]/50 hover:scale-105'
                        }`}
                        style={{ background: color.previewBg }}
                        title={color.name}
                      >
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ebb548]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hidden YouTube player container */}
      <div className="fixed -top-[500px] -left-[500px] w-1 h-1 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
        <div ref={containerRef} id="yt-player-iframe" />
      </div>

      {/* ═══════════════════════════════════════════
          COMPACT HORIZONTAL PHILIPS RADIO (BOTTOM ANCHORED)
          ═══════════════════════════════════════════ */}
      <div className="fixed player-bottom-position left-1/2 -translate-x-1/2 z-30 w-full max-w-[calc(100%-1.25rem)] sm:max-w-xl md:max-w-2xl px-1 sm:px-4 pointer-events-none" id="player-wrapper">
        
        {/* Mechanical buttons - extremely compact, positioned right above the panel */}
        <div className="flex gap-1 sm:gap-1.5 justify-center pointer-events-auto font-retro text-[8px] mb-[1px] flex-wrap" id="playlist-tabs">
          {playlists.map((pl) => {
            const isActive = activePlaylistId === pl.id;
            const isEditing = editingPlaylistId === pl.id;
            const displayName = getPlaylistName(pl);
            return (
              <button
                key={pl.id}
                onClick={() => {
                  if (!isEditing) handlePlaylistChange(pl);
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  if (!isUploadOpen) {
                    setEditingPlaylistId(pl.id);
                    setTimeout(() => renameInputRef.current?.focus(), 50);
                  }
                }}
                className={`h-5 sm:h-6 text-[7px] sm:text-[7.5px] font-bold font-retro uppercase rounded-t-[4px] cursor-pointer select-none border-t border-x transition-all duration-300 ease-in-out origin-bottom ${
                  isUploadOpen
                    ? "w-0 opacity-0 scale-90 pointer-events-none mx-0 px-0 border-none overflow-hidden"
                    : isEditing
                      ? "min-w-[64px] sm:min-w-[80px] px-1 mx-[0.5px] opacity-100 scale-100"
                      : "min-w-[42px] sm:min-w-[50px] px-2 mx-[0.5px] opacity-100 scale-100"
                } ${
                  isActive
                    ? "bg-[#d8cbb0] text-[#50370d] border-t-[4px] border-t-stone-700 border-x border-stone-400 shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] translate-y-[2px]"
                    : "bg-gradient-to-b from-[#f7ebd3] to-[#e6d8be] text-[#6b4c1b] border-t border-x border-[#c2b59b] hover:from-[#fff7eb] hover:to-[#ebdcb9] shadow-[0_2px_4px_rgba(0,0,0,0.4)] active:translate-y-[1px] active:shadow-inner"
                }`}
                style={{
                  textShadow: isActive ? 'none' : '0 0.5px 0.5px rgba(255,255,255,0.8)'
                }}
              >
                {isEditing ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    defaultValue={displayName}
                    maxLength={8}
                    className="w-full bg-transparent text-center text-[7px] sm:text-[7.5px] font-bold font-retro uppercase outline-none border-b border-[#50370d]/50 text-[#50370d] caret-[#c8102e]"
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.code === 'Space') e.preventDefault();
                      if (e.key === 'Enter') handleRenameSubmit(pl.id, (e.target as HTMLInputElement).value);
                      if (e.key === 'Escape') setEditingPlaylistId(null);
                    }}
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\s/g, '');
                    }}
                    onBlur={(e) => handleRenameSubmit(pl.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  !isUploadOpen && displayName
                )}
              </button>
            );
          })}

          {/* The Upload/Add Toggle Switch (Old Style Metal Lever & Indicator Lamp) */}
          <button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="h-5 sm:h-6 px-2 flex items-center gap-1.5 bg-gradient-to-b from-[#2e261f] to-[#1c1611] rounded-t-[4px] border-t border-x border-[#50370d] shadow-[0_1.5px_3px_rgba(0,0,0,0.45)] hover:from-[#3a3027] hover:to-[#221b14] active:translate-y-[0.5px] cursor-pointer select-none transition-all duration-300 ease-in-out"
            title="Toggle Cassette Loader"
          >
            {/* Tiny Indicator Light */}
            <span 
              className={`w-1.5 h-1.5 rounded-full border border-black/50 transition-all duration-300 shrink-0 ${
                isUploadOpen 
                  ? 'bg-[#c8102e] shadow-[0_0_5px_#ef4444,inset_0_0.5px_0.5px_white]' 
                  : 'bg-red-950/80 shadow-[inset_0_0.5px_0.5px_rgba(0,0,0,0.6)]'
              }`} 
            />

            {/* Toggle Switch Track & Lever */}
            <div className="w-2.5 h-3.5 bg-[#090b0e] rounded-[2px] border border-stone-800/80 relative flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {/* Center divider shadow */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/60" />
              {/* Metallic lever handle */}
              <div 
                className={`absolute w-1.5 h-1.5 rounded-[1px] border border-stone-500/80 shadow-[0_0.5px_1.5px_rgba(0,0,0,0.6)] transition-all duration-300 ${
                  isUploadOpen ? '-translate-y-0.75 bg-gradient-to-b from-stone-100 to-stone-400' : 'translate-y-0.75 bg-gradient-to-b from-stone-200 to-stone-500'
                }`}
              />
            </div>

            {/* Switch Label */}
            <span className="text-[6.5px] sm:text-[7.5px] text-[#ebb548] font-bold uppercase tracking-tight font-retro leading-none">
              {isUploadOpen ? "CLOSE" : "ADD"}
            </span>
          </button>
        </div>

        {/* Animated Slide Drawer (Cassette/Tape Slot compartment) */}
        <div
          className={`w-full overflow-hidden transition-all duration-500 ease-in-out pointer-events-auto ${
            isUploadOpen ? "max-h-[200px] opacity-100 mb-1.5" : "max-h-0 opacity-0 mb-0"
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
                <span>ADD SONG TO PLAYLIST</span>
                {uploading && (
                  <span className="flex items-center gap-1 text-[#c8102e] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c8102e]" />
                    REC
                  </span>
                )}
              </div>

              {uploadSuccess ? (
                <div className="flex flex-col items-center justify-center py-3 text-emerald-400 font-bold select-none text-[10px] sm:text-xs">
                  <span className="text-[16px] mb-1">✓</span>
                  <span>ADDED TO {customNames[uploadPlaylist] || playlists.find(p => p.id === uploadPlaylist)?.name || uploadPlaylist.toUpperCase()}!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Playlist Picker */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[7px] sm:text-[8px] text-cream/50 mr-1 shrink-0">PLAYLIST:</span>
                    {playlists.map(pl => {
                      const isEditing = editingPlaylistId === pl.id;
                      const displayName = getPlaylistName(pl);
                      return (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => {
                            if (!isEditing) setUploadPlaylist(pl.id);
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            setEditingPlaylistId(pl.id);
                            setTimeout(() => renameInputRef.current?.focus(), 50);
                          }}
                          className={`px-1.5 sm:px-2 py-0.5 text-[6.5px] sm:text-[7.5px] font-bold uppercase rounded cursor-pointer transition-all duration-150 border select-none ${
                            isEditing ? "w-16 sm:w-20" : ""
                          } ${
                            uploadPlaylist === pl.id
                              ? "bg-[#ebb548] text-[#382504] border-[#a67c22] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]"
                              : "bg-black/40 text-cream/60 border-[#ebb548]/20 hover:bg-black/60 hover:text-cream/80"
                          }`}
                          title="Double Click to Rename"
                        >
                          {isEditing ? (
                            <input
                              ref={renameInputRef}
                              type="text"
                              defaultValue={displayName}
                              maxLength={8}
                              className="w-full bg-transparent text-center text-[6.5px] sm:text-[7px] font-bold font-retro uppercase outline-none border-b border-[#50370d]/50 text-cream caret-[#c8102e]"
                              onKeyDown={(e) => {
                                if (e.key === ' ' || e.code === 'Space') e.preventDefault();
                                if (e.key === 'Enter') handleRenameSubmit(pl.id, (e.target as HTMLInputElement).value);
                                if (e.key === 'Escape') setEditingPlaylistId(null);
                              }}
                              onChange={(e) => {
                                e.target.value = e.target.value.replace(/\s/g, '');
                              }}
                              onBlur={(e) => handleRenameSubmit(pl.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            displayName
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* File Picker + Load Button */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#ebb548]/30 rounded-lg py-2.5 px-2 bg-black/40 hover:bg-black/60 hover:border-[#ebb548]/60 cursor-pointer transition-all duration-150"
                    >
                      <span className="text-[8px] sm:text-[10px] text-cream/70 font-semibold truncate max-w-[180px] sm:max-w-[260px]">
                        {selectedFile ? selectedFile.name : "CHOOSE AUDIO FILE"}
                      </span>
                      <span className="text-[5.5px] sm:text-[7px] text-brass mt-0.5">MP3, WAV, M4A, OGG</span>
                    </button>

                    <button
                      disabled={uploading || !selectedFile}
                      onClick={() => selectedFile && handleUpload(selectedFile)}
                      className={`px-2.5 sm:px-3 py-2 text-[7.5px] sm:text-[9px] font-bold uppercase rounded-md shadow-md border cursor-pointer transition-all ${
                        selectedFile && !uploading
                          ? "bg-gradient-to-b from-[#ebb548] to-[#bd8c25] text-[#382504] border-[#a67c22] hover:scale-103 active:scale-97"
                          : "bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed"
                      }`}
                    >
                      {uploading ? "REC..." : "LOAD"}
                    </button>
                  </div>

                  {uploadError && (
                    <div className="text-[#c8102e] text-[7.5px] sm:text-[8.5px] font-bold text-center leading-none mt-1 select-none">
                      ERROR: {uploadError}
                    </div>
                  )}

                  {/* Songs List inside Selected Playlist */}
                  <div className="border-t border-[#ebb548]/20 pt-2 mt-2">
                    <div className="text-[7.5px] sm:text-[8.5px] text-brass font-bold uppercase tracking-wider mb-1.5 select-none flex justify-between">
                      <span>SONGS IN THIS PLAYLIST</span>
                      <span className="text-cream/55 font-normal">({(playlists.find(p => p.id === uploadPlaylist)?.tracks || []).length} TRACKS)</span>
                    </div>
                    {(playlists.find(p => p.id === uploadPlaylist)?.tracks || []).length === 0 ? (
                      <div className="text-center py-2 text-cream/45 text-[7px] sm:text-[8px] italic select-none">
                        No songs in this playlist yet.
                      </div>
                    ) : (
                      <div className="max-h-24 sm:max-h-28 overflow-y-auto pr-1 flex flex-col gap-1 font-retro select-none scrollbar-thin">
                        {(playlists.find(p => p.id === uploadPlaylist)?.tracks || []).map((track, i) => {
                          const isUploaded = !!track.fileName;
                          return (
                            <div key={track.id} className="flex justify-between items-center bg-black/35 rounded px-2 py-1 text-[7px] sm:text-[8px] border border-stone-800/40 hover:bg-black/55 transition-all">
                              <div className="truncate flex-1 pr-2 text-left">
                                <span className="text-cream/45 mr-1.5 font-semibold">{(i + 1).toString().padStart(2, '0')}</span>
                                <span className="text-cream font-medium">{track.title}</span>
                                <span className="text-brass/75 font-semibold uppercase ml-1.5 text-[6px] sm:text-[7px]">{track.artist}</span>
                              </div>
                              {isUploaded && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSong(track.id)}
                                  className="text-stone-400 hover:text-[#c8102e] cursor-pointer transition-colors p-0.5"
                                  title="Delete Song"
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={`pointer-events-auto w-full rounded-[6px] sm:rounded-[10px] border-[3px] sm:border-[5px] relative overflow-hidden select-none shadow-[0_12px_40px_rgba(0,0,0,0.75)] transition-all duration-500 ease-in-out ${activeColor.borderClass}`}
          style={{
            background: activeColor.background,
          }}
        >
          {/* Gold highlight wire */}
          <div className="w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)' }} />

          <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            
            {/* === MOBILE TOP ROW: Track Info + Seek Bar === */}
            <div className="flex items-center gap-2 w-full">
              {/* 2. Track Title & Artist (Compact list) */}
              <div className="flex flex-col justify-center min-w-0 max-w-[90px] sm:max-w-[140px] text-left select-none shrink-0 leading-none">
                <span className="text-[9px] sm:text-[11px] font-semibold text-cream truncate font-retro drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {currentTrack.title}
                </span>
                <span className="text-[7px] sm:text-[8px] text-brass font-bold uppercase truncate font-retro mt-[2px] sm:mt-[3px] drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.9)]">
                  {currentTrack.artist}
                </span>
              </div>

              {/* 3. Glass Dial Seek Bar (Center) */}
              <div className="flex-1 h-8 sm:h-11 select-none relative">
                <div
                  ref={seekContainerRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="h-full w-full relative rounded-md border border-[#50370d] bg-[#070b13] overflow-hidden cursor-pointer touch-none shadow-inner"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,161,58,0.25)_0%,transparent_80%)]" />

                  {/* Gold scales */}
                  <div className="absolute inset-0 px-1.5 sm:px-2 py-0.5 sm:py-1 flex flex-col justify-between font-retro text-[5.5px] sm:text-[7.5px] text-[#ebb548]/95 font-bold opacity-85 pointer-events-none">
                    <div className="flex justify-between tracking-wide leading-none">
                      <span>DELHI</span>
                      <span>KOLKATA</span>
                      <span>MUMBAI</span>
                      <span>MADRAS</span>
                    </div>
                    <div className="flex justify-between text-[4.5px] sm:text-[6.5px] text-[#ebb548]/45 leading-none">
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

              {/* Timer - visible on mobile in top row, hidden on sm+ (shown in bottom row there) */}
              <div className="text-right shrink-0 select-none leading-none font-retro font-bold text-[#ebb548]/90 text-[7px] sm:hidden">
                <div>{formatTime(elapsed)}</div>
                <div className="text-[5.5px] text-cream/35 font-normal mt-[2px]">{formatTime(duration)}</div>
              </div>
            </div>

            {/* === MOBILE BOTTOM ROW / DESKTOP SAME ROW: Controls === */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* 4. Knob 0: Prev */}
              <div className="shrink-0 flex flex-col items-center">
                <button
                  onClick={playPrev}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full relative cursor-pointer hover:scale-105 active:scale-90 active:-rotate-45 hover:border-[#ebb548] transition-all duration-300 ease-out"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #fff 15%, #f4eede 35%, #cfc5aa 70%, #7c745e 100%)',
                    border: '3px solid #50370d',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.65), inset 0 0.5px 1px rgba(255,255,255,1)',
                  }}
                  title="Previous Track"
                >
                  <div className="absolute inset-[4px] sm:inset-[5px] rounded-full bg-[#50370d] flex items-center justify-center shadow-inner">
                    <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-0.5 h-1 sm:h-1.5 bg-[#fcd979] rounded-full" />
                    <PrevIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#fcd979]" />
                  </div>
                </button>
              </div>

              {/* 5. Knob 1: Vol/Play */}
              <div className="shrink-0 flex flex-col items-center">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full relative cursor-pointer hover:scale-105 active:scale-90 hover:border-[#ebb548] transition-all duration-300 ease-out"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #fff 15%, #f4eede 35%, #cfc5aa 70%, #7c745e 100%)',
                    border: '3px solid #50370d',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.65), inset 0 0.5px 1px rgba(255,255,255,1)',
                    transform: isPlaying ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s, box-shadow 0.2s, scale 0.2s',
                  }}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  <div className="absolute inset-[4px] sm:inset-[5px] rounded-full bg-[#50370d] flex items-center justify-center shadow-inner">
                    <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-0.5 h-1 sm:h-1.5 bg-[#fcd979] rounded-full" />
                    {isPlaying ? <PauseIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#fcd979]" /> : <PlayIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#fcd979]" />}
                  </div>
                </button>
              </div>

              {/* 6. Knob 2: Tune/Next */}
              <div className="shrink-0 flex flex-col items-center">
                <button
                  onClick={playNext}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full relative cursor-pointer hover:scale-105 active:scale-90 active:rotate-45 hover:border-[#ebb548] transition-all duration-300 ease-out"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #fff 15%, #f4eede 35%, #cfc5aa 70%, #7c745e 100%)',
                    border: '3px solid #50370d',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.65), inset 0 0.5px 1px rgba(255,255,255,1)',
                  }}
                  title="Next Track (Tune)"
                >
                  <div className="absolute inset-[4px] sm:inset-[5px] rounded-full bg-[#50370d] flex items-center justify-center shadow-inner">
                    <div className="absolute top-[1px] left-1/2 -translate-x-1/2 w-0.5 h-1 sm:h-1.5 bg-[#fcd979] rounded-full" />
                    <NextIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#fcd979]" />
                  </div>
                </button>
              </div>

              {/* Volume Up/Down Panel */}
              <div className="shrink-0 flex items-center gap-1 sm:gap-1.5 bg-[#080a0f] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#ebb548]/20 shadow-[inset_0_1.5px_3.5px_rgba(0,0,0,0.85)] select-none pointer-events-auto">
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

              {/* 7. Elapsed time readout - hidden on mobile (shown in top row), visible on sm+ */}
              <div className="text-right shrink-0 select-none leading-none font-retro font-bold text-[#ebb548]/90 text-[8px] sm:text-[9.5px] hidden sm:block">
                <div>{formatTime(elapsed)}</div>
                <div className="text-[6.5px] text-cream/35 font-normal mt-[3px]">{formatTime(duration)}</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
