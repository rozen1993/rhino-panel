// Fictitious public examples only. No existing demo storage is read or changed.
import type { AunorWorkspace } from "@/lib/aunor";
export const aunorServiceLabels = [
  ["cobertura","Cobertura fotográfica y audiovisual"],["redes","Videos para redes sociales"],
  ["micronews","Micronews internos"],["resumen-anual","Videos de resumen anual"],
  ["fiesta","Videos de fiesta de fin de año"],["campanas","Videos de campañas internas"],
  ["social-ambiental","Videos sociales y ambientales"],["seguridad-vial","Videos de seguridad vial"],
  ["voluntariado","Videos de voluntariado"],["ositran","Postproducción de resumen OSITRAN"],
  ["webinars","Webinars"],["radio","Spots radiales"],
] as const;
export function createAunorExamples(): AunorWorkspace {
  const at="2026-06-19T14:15:00Z";
  return {
    services:aunorServiceLabels.map(([id,label],i)=>({id,label,position:i+1,reference:"Cláusula 2.2"})),
    activities:[
      {id:"cobertura-norte",type:"Grabación",title:"Cobertura audiovisual Norte",status:"Entregada",place:"Norte",summary:"Cobertura publicada para Aunor. Ejemplo ficticio.",service_id:"cobertura",not_performed_reason:"",publication_version:1,published_at:at,unread_count:1},
      {id:"edicion-seguridad",type:"Edición",title:"Edición campaña de seguridad vial",status:"En proceso",place:"Edición remota",summary:"Edición de piezas para la campaña vial.",service_id:"seguridad-vial",not_performed_reason:"",publication_version:1,published_at:at,unread_count:1},
      {id:"aunor-original",type:"Grabación",title:"Taller de seguridad vial",status:"Programada",place:"Base Norte",summary:"Actividad original conservada.",service_id:"cobertura",not_performed_reason:"Evento cancelado por Aunor, según llamada registrada.",publication_version:1,published_at:at,unread_count:0},
      {id:"aunor-senalizacion",type:"Grabación",title:"Registro de señalización",status:"Entregada",place:"Tramo Sur",summary:"Trabajo de Aunor pendiente de asociar a un servicio.",service_id:null,not_performed_reason:"",publication_version:1,published_at:at,unread_count:0},
    ],
    journeys:[
      {activity_id:"cobertura-norte",position:1,start_date:"2026-01-04",end_date:"2026-01-04",place:"Caseta Norte"},
      {activity_id:"cobertura-norte",position:2,start_date:"2026-01-11",end_date:"2026-01-11",place:"Puesto Central"},
      {activity_id:"cobertura-norte",position:3,start_date:"2026-02-02",end_date:"2026-02-02",place:"Caseta Norte"},
      {activity_id:"edicion-seguridad",position:1,start_date:"2026-05-12",end_date:"2026-05-19",place:"Edición remota"},
      {activity_id:"aunor-original",position:1,start_date:"2026-01-04",end_date:"2026-01-04",place:"Base Norte"},
      {activity_id:"aunor-senalizacion",position:1,start_date:"2026-01-04",end_date:"2026-01-04",place:"Tramo Sur"},
    ],
    deliveries:[{id:"delivery-demo-1",activity_id:"cobertura-norte",version:1,material_link:"https://example.invalid/material-ejemplo.mp4",label:"Cobertura Norte · ejemplo",published_at:at,confirmed_at:null,confirmed_by:null,is_current:true}],
    agreements:[{id:"agreement-demo-1",activity_id:"aunor-original",channel:"Llamada",contacted_at:"2026-01-02T16:30:00-05:00",requester_declared:"Ejecutivo de Aunor, según llamada",body:"Solicitó cubrir entrevistas en lugar del taller cancelado. Registro ficticio.",evidence_link:"",recorded_by:"Admin · Rhino",recorded_at:at,corrects_id:null,is_current:true}],
    replacements:[{id:"replacement-demo-1",original_activity_id:"aunor-original",substitute_activity_id:"cobertura-norte",original_title:"Taller de seguridad vial",substitute_title:"Cobertura audiovisual Norte",agreement_id:"agreement-demo-1",reason:"Evento cancelado, según llamada registrada.",evidence_note:"Nota de llamada del 2 de enero. Ejemplo ficticio.",evidence_link:"",recorded_by:"Admin · Rhino",recorded_at:at,corrects_id:null,confirmed_at:null,confirmed_by:null,is_current:true}],
    messages:[
      {id:"message-demo-1",sequence:1,activity_id:"cobertura-norte",author:"Aunor",author_role:"aunor",body:"¿Dónde podemos revisar el material?",created_at:"2026-06-19T13:00:00Z",corrects_id:null,is_own:false},
      {id:"message-demo-2",sequence:2,activity_id:"cobertura-norte",author:"Admin · Rhino",author_role:"admin",body:"El enlace está en la entrega. Después de revisarla, pueden confirmarla expresamente.",created_at:at,corrects_id:null,is_own:false},
      {id:"message-demo-3",sequence:3,activity_id:"edicion-seguridad",author:"Admin · Rhino",author_role:"admin",body:"La edición continúa según la planificación publicada.",created_at:at,corrects_id:null,is_own:false},
    ],
  };
}
