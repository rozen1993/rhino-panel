import Image from "next/image";
import Link from "next/link";
import { SystemIcon } from "@/components/system-icon";
import styles from "./historical-entry.module.css";

const entries = [
  { category: "Grabación", slug: "grabacion", image: "/historico/grabacion-ilustrativa.png", label: "EN CAMPO", description: "Coberturas, jornadas y lugares de grabación." },
  { category: "Edición", slug: "edicion", image: "/historico/edicion-ilustrativa.png", label: "POSTPRODUCCIÓN", description: "Piezas, jornadas y entregas de edición." },
];

export function HistoricalEntry({ year, basePath = "/historico" }: { year: number; basePath?: string }) {
  return <>
    <section className={styles.portal}>
      <header className={styles.heading}>
        <div>
          <p className="data-label text-cyan-ink">Archivo operativo · {year}</p>
          <h1 className="section-title mt-1 text-2xl md:text-3xl">Histórico {year}</h1>
          <p className={styles.subtitle}>Elige el histórico que quieres consultar.</p>
        </div>
      </header>
      <div className={styles.bands}>
        {entries.map((entry, index) => <Link
          key={entry.slug}
          href={{ pathname: basePath, query: { tipo: entry.slug, anio: year } }}
          className={`${styles.card} ${index === 1 ? styles.editing : ""}`}
          aria-label={`Ver histórico de ${entry.category.toLowerCase()}`}
        >
          <div className={styles.imageFrame}><Image src={entry.image} alt="" fill sizes="(max-width: 700px) 100vw, 65vw" className={styles.photo} /></div>
          <span className={styles.shade} aria-hidden="true" />
          <p className={styles.tag}><i aria-hidden="true" />{entry.label}</p>
          <div className={styles.copy}>
            <h2>{entry.category}</h2>
            <p className={styles.description}>{entry.description}</p>
            <span className={styles.action}><span className={styles.arrow}><SystemIcon name="arrow-right" className="size-4" /></span>Ver histórico de {entry.category.toLowerCase()}</span>
          </div>
        </Link>)}
      </div>
      <footer className={styles.footer}>
        <SystemIcon name="calendar" className="size-4 shrink-0 text-cyan-ink" />
        <span>Cada categoría abre su calendario anual de actividades.</span>
      </footer>
    </section>
    <p className={styles.note}>Fotografías ilustrativas; no documentan trabajos reales.</p>
  </>;
}
