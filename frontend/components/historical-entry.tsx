import Image from "next/image";
import Link from "next/link";
import styles from "./historical-entry.module.css";

const entries = [
  { category: "Grabación", slug: "grabacion", image: "/historico/grabacion-ilustrativa.png", label: "EN CAMPO", description: "Coberturas, jornadas y lugares de grabación." },
  { category: "Edición", slug: "edicion", image: "/historico/edicion-ilustrativa.png", label: "POSTPRODUCCIÓN", description: "Piezas, jornadas y entregas de edición." },
];

export function HistoricalEntry({ year }: { year: number }) {
  return <>
    <section className={styles.portal}>
      <header className={styles.heading}>
        <div>
          <p className="data-label text-cyan-ink">Archivo operativo · {year}</p>
          <h1 className="section-title mt-1 text-2xl md:text-3xl">Histórico {year}</h1>
          <p className={styles.subtitle}>Elige el histórico que quieres consultar.</p>
        </div>
      </header>
      <div className={styles.versus}>
        {entries.map((entry, index) => <Link
          key={entry.slug}
          href={{ pathname: "/historico", query: { tipo: entry.slug, anio: year } }}
          className={`${styles.card} ${index === 0 ? styles.recording : styles.editing}`}
          aria-label={`Ver histórico de ${entry.category.toLowerCase()}`}
        >
          <Image src={entry.image} alt="" fill sizes="(max-width: 767px) 100vw, 55vw" className={styles.photo} />
          <span className={styles.shade} />
          <div className={styles.copy}>
            <p className={styles.tag}><i aria-hidden="true" />{entry.label}</p>
            <h2>{entry.category}</h2>
            <p className={styles.description}>{entry.description}</p>
            <span className={styles.action}>Ver histórico de {entry.category.toLowerCase()} <span aria-hidden="true">→</span></span>
          </div>
        </Link>)}
        <span className={styles.vs} aria-hidden="true">VS</span>
      </div>
      <footer className={styles.footer}>
        <span>El mismo calendario anual, organizado por categoría.</span>
        <Link href={{ pathname: "/historico", query: { tipo: "todos", anio: year } }}>Ver todo el Histórico →</Link>
      </footer>
    </section>
    <p className={styles.note}>Fotografías ilustrativas; no documentan trabajos reales.</p>
  </>;
}
