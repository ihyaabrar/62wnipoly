"use client";

import { useState } from "react";
import { Setup, type GameSetup } from "./Setup";
import { Play } from "./Play";

/** Alur: layar persiapan -> permainan. "Main lagi" memakai pengaturan sama dengan seed baru. */
export default function Game() {
  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [round, setRound] = useState(0);
  if (!setup) return <Setup onStart={setSetup} />;
  return (
    <Play
      key={round}
      setup={setup}
      onExit={() => setSetup(null)}
      onRestart={() => {
        setSetup({ ...setup, seed: Math.floor(Math.random() * 2 ** 31) });
        setRound((r) => r + 1);
      }}
    />
  );
}
