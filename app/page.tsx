import PlayerClient from "./player-client";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden text-cream font-sans selection:bg-brass/35 selection:text-white">
      <h1 className="sr-only">S.P Hostel — Estd. 1956 | Retro Hostel Radio</h1>

      {/* Player Dashboard, Header, and Background are managed inside PlayerClient for reactivity */}
      <PlayerClient />
    </main>
  );
}
