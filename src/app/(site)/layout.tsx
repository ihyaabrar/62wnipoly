import Link from "next/link";
import { SiteNav } from "./SiteNav";
import css from "./site.module.css";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={css.shell} id="situs">
      <SiteNav />
      {children}
      <footer className={css.footer}>
        <div className={css.tape} aria-hidden="true" />
        <div className={css.footerInner}>
          <p>
            +62WNIPOLY adalah karya satire. Semua tokoh di dalam game fiktif. Kejadian di kartu merujuk berita nyata, dan sumbernya tercantum di tiap kartu.
          </p>
          <nav aria-label="Tautan bawah">
            <Link href="/main">Main</Link>
            <Link href="/glosarium">Glosarium</Link>
            <Link href="/peran">Peran</Link>
            <Link href="/bencana">Bencana</Link>
            <Link href="/assets">Katalog aset 3D</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
