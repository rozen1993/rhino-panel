import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErasureControl } from "@/components/erasure-control";
const mocks=vi.hoisted(()=>({preview:vi.fn(),execute:vi.fn(),refresh:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:mocks.refresh})}));
vi.mock("@/app/papelera/erasure-actions",()=>({previewErasureAction:mocks.preview,executeErasureAction:mocks.execute}));
beforeEach(()=>{
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  mocks.preview.mockResolvedValue({ok:true,preview:{fingerprint:"a".repeat(64),total:7,activities:[{id:"fixture",title:"Trabajo afectado",responsible:"Operario",trashed:true}],counts:{"public.activities":1,"private.record_history":6}}});
  mocks.execute.mockResolvedValue({ok:true});
});
describe("confirmación de borrado definitivo",()=>{
  it("muestra impacto y requiere contraseña y frase antes de enviar",async()=>{
    const deleted=vi.fn();
    render(<ErasureControl kind="trash" dataSource="supabase" onDeleted={deleted}/>);
    fireEvent.click(screen.getByRole("button",{name:"Vaciar papelera"}));
    await screen.findByText("Trabajo afectado");
    const submit=screen.getByRole("button",{name:"Eliminar definitivamente"}) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Contraseña del Admin"),{target:{value:"Example-only-password!"}});
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Escribe ELIMINAR DEFINITIVAMENTE"),{target:{value:"ELIMINAR DEFINITIVAMENTE"}});
    fireEvent.click(submit);
    await waitFor(()=>expect(deleted).toHaveBeenCalledOnce());
    expect(mocks.execute).toHaveBeenCalledWith("trash",null,"a".repeat(64),"Example-only-password!","ELIMINAR DEFINITIVAMENTE");
    expect(screen.queryByLabelText("Contraseña del Admin")).toBeNull();
  });
  it("cancelar no elimina y un error borra la contraseña del formulario",async()=>{
    mocks.execute.mockResolvedValue({ok:false,error:"La contraseña no es correcta."});
    render(<ErasureControl kind="account" target="fixture-account" label="Cuenta inactiva" dataSource="supabase"/>);
    fireEvent.click(screen.getByRole("button",{name:"Eliminar"}));
    await screen.findByText("Trabajo afectado");
    fireEvent.change(screen.getByLabelText("Contraseña del Admin"),{target:{value:"WrongPassword!"}});
    fireEvent.change(screen.getByLabelText("Escribe ELIMINAR DEFINITIVAMENTE"),{target:{value:"ELIMINAR DEFINITIVAMENTE"}});
    fireEvent.click(screen.getByRole("button",{name:"Eliminar definitivamente"}));
    await screen.findByRole("alert");
    expect((screen.getByLabelText("Contraseña del Admin") as HTMLInputElement).value).toBe("");
    fireEvent.click(screen.getByRole("button",{name:"Cancelar"}));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mocks.execute).toHaveBeenCalledOnce();
  });
});
