"use client";

import dynamic from "next/dynamic";

// Game memakai WebGL dan state di browser, jadi hanya dirender di klien.
const Game = dynamic(() => import("@/game/Game"), { ssr: false, loading: () => <p style={{ padding: 24 }}>Menyiapkan negeri…</p> });

export default function MainPage() {
  return <Game />;
}
