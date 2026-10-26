import Link from "next/link";
import { CARDS, CHARACTERS, RULES } from "@/engine/data";
import { CardArt } from "@/game/CardArt";
import { ZONE_INFO } from "./zones";
import css from "./site.module.css";

const STEPS = [
  { k: "Kocok", t: "Tahan tombol atau Spasi untuk mengocok dadu, lepaskan untuk melempar. Makin lama ditahan, makin kencang lemparannya." },
  { k: "Jalan", t: "Tiap petak menawarkan pilihan: kerja, makan, istirahat, atau aksi khas petak itu, dari tambang belerang sampai bayar orang dalam." },
  { k: "Tarik kartu", t: "Kesempatan kuning kadang menolong. Musibah hitam jarang. Sebagian kartu menghantam semua pemain sekaligus." },
  { k: "Akhir ronde", t: "Bencana menghantam zona acak. Level Krisis naik tiap dua ronde: bencana makin sering, harga makin mahal." },
  { k: "Bertahan", t: `Gugur kalau sehat habis, kelaparan ${RULES.starveTurnsToDie} giliran berturut-turut, atau utang lewat batas pinjol. Yang terakhir hidup menang.` },
];

const TEASER = ["bbm-langka", "potongan-ojol", "rekening-blokir"].map((id) => CARDS.find((c) => c.id === id)!);

export default function Home() {
  return (
    <main>
      <section className={css.hero}>
        <img className={css.heroImg} src="/papan.jpg" alt="Papan 3D +62WNIPOLY: Monas di tengah, gunung meletus di utara, pesisir banjir di selatan" />
        <div className={css.heroFade} aria-hidden="true" />
        <div className={css.heroText}>
          <p className={css.kicker}>Monopoli satire Indonesia · 1 pemain lawan 1-3 bot · gratis di browser</p>
          <h1 className={css.heroLogo}>
            <span className={css.logo62}>+62</span>
            <span>
              WNI<span className={css.poly}>POLY</span>
            </span>
          </h1>
          <p className={css.tagline}>
            Bukan siapa yang paling kaya. Siapa yang paling kuat <mark>bertahan</mark>.
          </p>
          <p className={css.topics}>Banjir · Karhutla · Erupsi · Pungli · BBM langka · Pinjol</p>
          <div className={css.ctaRow}>
            <Link href="/main" className={css.cta}>
              Mulai bertahan hidup
            </Link>
            <Link href="/glosarium" className={css.ghost}>
              Lihat semua kartu
            </Link>
          </div>
        </div>
      </section>
      <div className={css.tape} aria-hidden="true" />

      <section className={css.wrap}>
        <div className={css.split}>
          <div>
            <h2 className={css.h2}>Monopoli tanpa properti</h2>
            <p className={css.lead}>
              Kamu warga biasa. Tidak ada hotel yang bisa dibeli. Yang ada: gaji yang langsung dipotong pajak, harga beras yang naik tiap ronde, dan bencana yang
              datang bergiliran ke empat penjuru papan.
            </p>
          </div>
          <ul className={css.meters}>
            <li style={{ ["--c" as string]: "#4caf50" }}>
              <b>Sehat</b>
              <span>Terkuras oleh kerja, asap, dan bencana. Pulih dengan istirahat atau berobat, kalau kuat antre.</span>
            </li>
            <li style={{ ["--c" as string]: "var(--kuning)" }}>
              <b>Dompet</b>
              <span>Boleh minus. Lewat batas, pinjol datang menjemput.</span>
            </li>
            <li style={{ ["--c" as string]: "var(--lava)" }}>
              <b>Makanan</b>
              <span>Satu porsi habis tiap giliran. Kosong dua kali: tumbang.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className={css.wrap}>
        <div className={css.headRow}>
          <h2 className={css.h2}>Empat penjuru, empat cara celaka</h2>
          <Link href="/bencana" className={css.textLink}>
            Detail bencana
          </Link>
        </div>
        <div className={css.zoneStrip}>
          {ZONE_INFO.map((z) => (
            <Link key={z.id} href={`/bencana#${z.id}`} className={css.zoneTile} style={{ ["--z" as string]: z.color }}>
              <small>{z.wind}</small>
              <b>{z.title}</b>
              <span>{z.short}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={css.wrap}>
        <h2 className={css.h2}>Cara main</h2>
        <ol className={css.steps}>
          {STEPS.map((s) => (
            <li key={s.k}>
              <b>{s.k}</b>
              <span>{s.t}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${css.wrap} ${css.cardsBand}`}>
        <div className={css.cardsCopy}>
          <h2 className={css.h2}>Kartu yang terasa terlalu nyata</h2>
          <p className={css.lead}>
            {CARDS.length} kartu, masing-masing menyindir kejadian yang benar terjadi, lengkap dengan sumber beritanya. Ada yang menimpa semua pemain, ada yang paling
            keras ke satu profesi.
          </p>
          <Link href="/glosarium" className={css.cta}>
            Buka glosarium kartu
          </Link>
        </div>
        <div className={css.fan}>
          {TEASER.map((c) => (
            <article key={c.id} className={c.deck === "kesempatan" ? css.cardK : css.cardM}>
              <small>{c.deck === "kesempatan" ? "? KESEMPATAN" : "! MUSIBAH"}</small>
              <h3>{c.title}</h3>
              <CardArt art={c.art} deck={c.deck} />
            </article>
          ))}
        </div>
      </section>

      <section className={css.wrap}>
        <div className={css.headRow}>
          <h2 className={css.h2}>Enam WNI, enam cara bertahan</h2>
          <Link href="/peran" className={css.textLink}>
            Bandingkan peran
          </Link>
        </div>
        <ul className={css.roleChips}>
          {Object.values(CHARACTERS).map((c) => (
            <li key={c.id}>
              <Link href={`/peran#${c.id}`}>
                <b>{c.name}</b>
                <span>{c.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={css.final}>
        <h2>Sudah siap jadi WNI?</h2>
        <p>Tanpa daftar akun. Pilih peran, pilih jumlah bot, langsung main.</p>
        <Link href="/main" className={css.cta}>
          Mulai bertahan hidup
        </Link>
      </section>
    </main>
  );
}
