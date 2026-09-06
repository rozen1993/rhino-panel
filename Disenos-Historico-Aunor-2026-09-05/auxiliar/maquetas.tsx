import React from "react";
import { SystemIcon } from "@/components/system-icon";

export const demoActivities = [
  { id:"G-DEMO-01", type:"Grabación", title:"Cobertura ilustrativa Norte", responsible:"Ana · ejemplo", place:"Sede Norte · lugar ficticio", responsibleAccountId:"demo-a", status:"Entregada", origin:"operario", spans:[{start:"2026-01-04",end:"2026-01-04"},{start:"2026-01-11",end:"2026-01-11"},{start:"2026-02-02",end:"2026-02-02"}], description:"Cobertura de ejemplo para visualizar jornadas discontinuas. No representa un servicio contratado.", operatorOpinion:"Ejemplo de una actividad entregada. No implica conformidad ni aprobación económica.", materialLink:"https://example.invalid/material-ilustrativo" },
  { id:"E-DEMO-01", type:"Edición", title:"Edición de pieza ilustrativa", responsible:"Carlos · ejemplo", place:"Sala de edición · ejemplo", responsibleAccountId:"demo-b", status:"En proceso", origin:"operario", spans:[{start:"2026-05-12",end:"2026-05-19"}], description:"Montaje de ejemplo con jornadas continuas. Las fechas y el contenido son ficticios.", operatorOpinion:"", materialLink:"" },
];
export const coincidentActivities = [
  {...demoActivities[0]},
  {...demoActivities[0], id:"G-DEMO-02", title:"Cobertura ilustrativa Sur", responsible:"Luis · ejemplo", place:"Sede Sur · ejemplo", spans:[{start:"2026-01-04",end:"2026-01-04"},{start:"2026-01-11",end:"2026-01-11"}]},
  {...demoActivities[0], id:"G-DEMO-03", title:"Entrevista de ejemplo", responsible:"Ana · ejemplo", place:"Estudio · ejemplo", spans:[{start:"2026-01-04",end:"2026-01-04"}]},
];

export function EvidenceBanner({text}:{text:string}){
  return <div className="mock-evidence"><span>MAQUETA PARA APROBACIÓN</span><span>{text}</span></div>;
}
function Action({children, secondary=false}:{children:React.ReactNode;secondary?:boolean}){
  return <button type="button" className={secondary?"mock-action secondary":"mock-action"}>{children}<span aria-hidden="true">↗</span></button>;
}
export function Portal({variant, photos}:{variant:string;photos:{recording:string;editing:string}}) {
 const options=[
  {category:"Grabación",src:photos.recording,tag:"DEL RODAJE AL ARCHIVO",description:"Consulta coberturas y jornadas de grabación.",icon:"activities",tone:"recording"},
  {category:"Edición",src:photos.editing,tag:"DEL MONTAJE A LA ENTREGA",description:"Consulta las jornadas de edición y sus entregas.",icon:"calendar",tone:"editing"}
 ];
 const titles={A:"Tarjetas enfrentadas",B:"Díptico cinematográfico",C:"Diagonal Rhino"};
 return <main className="mx-auto max-w-[1700px] p-3 md:p-5 xl:p-6">
  <EvidenceBanner text={"Variante "+variant+" · "+titles[variant]+" · fotos ilustrativas"}/>
  <section className={"mock-portal portal-"+variant}>
   <header className="mock-heading">
    <div><p className="data-label text-cyan-ink">ARCHIVO OPERATIVO</p><h1 className="section-title mt-1 text-2xl md:text-3xl">Histórico 2026</h1><p className="mock-subtitle">Elige el histórico que deseas consultar.</p></div>
    <div className="mock-year"><span>‹</span><strong>2026</strong><span>›</span></div>
   </header>
   <div className="mock-versus">
    {options.map(item=><article key={item.category} className={"mock-photo-card "+item.tone}>
      <div className="mock-photo"><img src={item.src} alt={"Fotografía ilustrativa de "+item.category.toLowerCase()}/><div className="mock-photo-shade"/></div>
      <div className="mock-photo-copy">
       <p className="mock-photo-tag"><i/>{item.tag}</p>
       <h2>{item.category}</h2><p className="mock-photo-description">{item.description}</p>
       <Action>Ver histórico de {item.category.toLowerCase()}</Action>
      </div>
    </article>)}
    <span className="mock-vs" aria-hidden="true">VS</span>
   </div>
   <footer className="mock-portal-footer"><span>El mismo calendario anual, organizado por categoría.</span><button type="button">Ver todo el Histórico <span>→</span></button></footer>
  </section>
  <p className="mock-illustration-note">Propuesta visual. Las fotografías son ilustrativas; no documentan trabajos reales.</p>
 </main>;
}
function NeutralTag({children}:{children:React.ReactNode}){return <span className="mock-neutral-tag">{children}</span>;}
function DocumentRow({label,value}:{label:string;value:string}){return <div className="mock-document-row"><span>{label}</span><strong>{value}</strong></div>;}
export function Aunor(){
 return <main className="mx-auto max-w-[1700px] p-3 md:p-5 xl:p-6">
  <EvidenceBanner text="Datos ficticios · no transcribe el contrato ni registra aprobaciones"/>
  <header className="mock-heading aunor-heading">
   <div><p className="data-label text-cyan-ink">MI PANEL / SEGUIMIENTO DOCUMENTAL</p><h1 className="section-title mt-1 text-2xl md:text-3xl">Seguimiento Aunor</h1><p className="mock-subtitle">Lo previsto, lo realizado y los cambios, en un mismo registro.</p></div>
   <Action secondary>Volver a mi panel</Action>
  </header>
  <div className="mock-aunor-grid">
   <section className="mock-aunor-main">
    <div className="mock-white-box">
     <div className="mock-box-heading"><h2 className="section-title">Referencias y trabajos</h2><NeutralTag>Ejemplo de consulta · 2026</NeutralTag></div>
     <p className="mock-muted">Vincula el trabajo realizado sin sustituir el documento original.</p>
     <article className="mock-reference">
      <div className="mock-reference-top"><p className="data-label text-cyan-ink">REF-DEMO-A · REFERENCIA ORIGINAL</p><NeutralTag>Original conservado</NeutralTag></div>
      <h3>Actividad prevista · ejemplo</h3>
      <p className="mock-reference-source">Texto, cláusula y alcance del contrato: <strong>por incorporar y verificar.</strong></p>
      <div className="mock-related"><span className="mock-related-dot"/><div><p className="data-label">G-DEMO-01 · GRABACIÓN</p><strong>Cobertura ilustrativa Norte</strong><p>Actividad vinculada en esta maqueta.</p></div><span className="mock-status-example">Entregada · ejemplo</span></div>
      <div className="mock-proposed-change">
       <p className="data-label">CAMBIO-DEMO-A · PROPUESTA DE REEMPLAZO</p>
       <div className="mock-change-path"><span>Actividad prevista</span><span aria-hidden="true">→</span><strong>Cobertura alternativa · ejemplo</strong></div>
       <p>Motivo: cambio de necesidad ilustrativo. Solicitante y respaldo: por registrar.</p>
       <NeutralTag>Propuesto · sin aprobación registrada</NeutralTag>
      </div>
     </article>
     <article className="mock-reference secondary-reference">
      <p className="data-label text-cyan-ink">REF-DEMO-B · REFERENCIA ORIGINAL</p>
      <h3>Referencia sin actividad vinculada</h3>
      <p>También permanece visible. Alcance y situación: por verificar.</p>
      <NeutralTag>Sin trabajo vinculado</NeutralTag>
     </article>
     <article className="mock-reference unlinked-reference">
      <p className="data-label text-cyan-ink">E-DEMO-01 · EDICIÓN</p>
      <h3>Edición de pieza ilustrativa</h3>
      <p><strong>Trabajo sin referencia identificada.</strong> No desaparece del registro ni se clasifica automáticamente como trabajo fuera del contrato.</p>
      <NeutralTag>Pendiente de vincular</NeutralTag>
     </article>
    </div>
    <div className="mock-preserve-note"><strong>El original se conserva.</strong> Un cambio propuesto, un rechazo o una baja operativa no borra la referencia ni las evidencias.</div>
   </section>
   <aside className="mock-aunor-detail">
    <p className="data-label text-cyan-ink">G-DEMO-01 · TRABAJO SELECCIONADO</p>
    <h2 className="section-title mt-1">Cobertura ilustrativa Norte</h2>
    <dl className="mock-detail-fields"><dt>Referencia</dt><dd>REF-DEMO-A · ejemplo</dd><dt>Responsable</dt><dd>Ana · ejemplo</dd><dt>Lugar</dt><dd>Sede Norte · ejemplo</dd></dl>
    <div className="mock-axis execution"><p className="data-label">EJECUCIÓN</p><strong>Entregada <small>· ejemplo</small></strong><p>Describe el avance del trabajo.</p></div>
    <div className="mock-axis"><p className="data-label">CONFORMIDAD DEL CLIENTE</p><strong>Sin constancia</strong><p>No hay aceptación documentada.</p></div>
    <div className="mock-axis"><p className="data-label">APROBACIÓN ECONÓMICA</p><strong>Sin constancia</strong><p>No equivale a aprobado ni pagado.</p></div>
    <section className="mock-evidence-list"><h3>Evidencias relacionadas</h3><DocumentRow label="Material entregado" value="Enlace por adjuntar"/><DocumentRow label="Conformidad" value="Sin documento"/><DocumentRow label="Aprobación económica" value="Sin documento"/></section>
    <Action>Registrar evidencia</Action>
    <p className="mock-aunor-caution">Maqueta sin importes, cantidades ni equivalencias contractuales. Los ejemplos no acreditan aprobaciones.</p>
   </aside>
  </div>
 </main>;
}
