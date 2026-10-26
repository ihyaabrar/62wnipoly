"use client";

import dynamic from "next/dynamic";

// Aset dibuat dengan canvas/WebGL, jadi hanya dirender di browser.
const Viewer = dynamic(() => import("./Viewer"), { ssr: false, loading: () => <p style={{ padding: 24 }}>Memuat katalog aset…</p> });

export default function AssetsPage() {
  return <Viewer />;
}
