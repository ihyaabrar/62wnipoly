"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import css from "./site.module.css";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/glosarium", label: "Glosarium" },
  { href: "/peran", label: "Peran" },
  { href: "/bencana", label: "Bencana" },
];

export function Logo() {
  return (
    <span className={css.logo}>
      <span className={css.logo62}>+62</span>
      <span>
        WNI<span className={css.poly}>POLY</span>
      </span>
    </span>
  );
}

export function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // Pindah halaman: tutup menu HP dan kembali ke atas (wadah scroll ada di layout, jadi posisinya tidak ter-reset sendiri).
  useEffect(() => {
    setOpen(false);
    if (!window.location.hash) document.getElementById("situs")?.scrollTo(0, 0);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={css.nav}>
      <div className={css.navInner}>
        <Link href="/" className={css.brand} aria-label="+62WNIPOLY, ke beranda">
          <Logo />
        </Link>
        <button type="button" className={css.burger} aria-expanded={open} aria-controls="menu-situs" onClick={() => setOpen((v) => !v)}>
          <span aria-hidden="true" />
          {open ? "Tutup" : "Menu"}
        </button>
        <nav id="menu-situs" className={`${css.links} ${open ? css.linksOpen : ""}`} aria-label="Menu utama">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <Link href="/main" className={css.navCta}>
            Main sekarang
          </Link>
        </nav>
      </div>
    </header>
  );
}
