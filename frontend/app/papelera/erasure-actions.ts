"use server";

import { revalidatePath } from "next/cache";
import { currentSupabaseRole } from "@/lib/supabase/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { functionErrorMessage } from "@/lib/supabase/function-error";
import { isUuid } from "@/lib/uuid";
import { erasureConfirmation, type ErasureKind, type ErasurePreview } from "@/lib/erasure";

function validTarget(kind: ErasureKind,target: string|null) {
  return kind === "trash" ? target === null : kind === "account" && isUuid(target ?? "");
}
async function currentActiveSupabaseRole() {
  const role=await currentSupabaseRole();
  return role?.mustChangePassword ? null : role;
}
export async function previewErasureAction(kind: ErasureKind,target: string|null): Promise<{ok:true;preview:ErasurePreview}|{ok:false;error:string}> {
  if ((await currentActiveSupabaseRole())?.id !== "admin" || !validTarget(kind,target)) return {ok:false,error:"Solo Admin puede revisar una eliminación válida."};
  const supabase = await createSupabaseServerClient();
  const {data,error} = await supabase.rpc("preview_erasure_v1",{p_kind:kind,p_target:target});
  if (error || !data) return {ok:false,error:"No se pudo preparar la eliminación. La cuenta debe estar desactivada y sin operaciones pendientes."};
  return {ok:true,preview:data as unknown as ErasurePreview};
}
export async function executeErasureAction(kind: ErasureKind,target: string|null,fingerprint: string,password: string,confirmation: string): Promise<{ok:true}|{ok:false;error:string}> {
  if ((await currentActiveSupabaseRole())?.id !== "admin" || !validTarget(kind,target)) return {ok:false,error:"Solo Admin puede eliminar definitivamente."};
  if (typeof password!=="string" || password.length<1 || password.length>256 || !/^[a-f0-9]{64}$/.test(fingerprint) || confirmation!==erasureConfirmation) return {ok:false,error:"Revisa la contraseña y escribe la confirmación completa."};
  const supabase = await createSupabaseServerClient();
  const {data,error} = await supabase.functions.invoke("admin-erasure",{body:{kind,target,fingerprint,password,confirmation}});
  if (error) return {ok:false,error:await functionErrorMessage(error,{
    invalid_admin_password:"La contraseña del Admin no es correcta.",
    rate_limited:"Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.",
    preview_changed:"Los datos cambiaron. Cierra este diálogo y revisa una nueva vista previa.",
    erasure_blocked:"No se eliminó la información: cambió una cuenta o existe una dependencia. Actualiza la vista previa.",
    account_erasure_failed:"Auth no completó la eliminación. Revisa el estado de la cuenta antes de reintentar; puede existir una dependencia o archivos en Storage.",
    administrator_required:"Tu sesión de Admin no permite esta operación. Vuelve a iniciar sesión.",
    verification_failed:"No se pudo completar la verificación de contraseña. No se inició el borrado.",
  },"No se pudo confirmar la eliminación. Actualiza la página antes de reintentar.")};
  if (data?.ok!==true) return {ok:false,error:"El servidor no confirmó la eliminación."};
  revalidatePath("/","layout");
  return {ok:true};
}
