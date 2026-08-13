import PlayerClient from "./player-client";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden text-cream font-sans selection:bg-brass/35 selection:text-white">
      <h1 className="sr-only">S.P Hostel — Estd. 1956 | Retro Hostel Radio</h1>

      {/* 1. Fixed Background — transparent parent main allows it to show clearly now! */}
      <div className="fixed inset-0 -z-20 hero-bg" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 grain-overlay" aria-hidden="true" />

      {/* Spacer to push player to the bottom, leaving the painting center fully visible */}
      <div className="flex-1" />

      {/* 2. Player Dashboard & Clock Elements */}
      <PlayerClient />
    </main>
  );
}
