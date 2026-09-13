import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { ReactNode } from "react";
const mocks=vi.hoisted(()=>({path:"/aunor",pending:false}));
vi.mock("next/navigation",()=>({usePathname:()=>mocks.path}));
vi.mock("next/link",()=>({useLinkStatus:()=>({pending:mocks.pending}),default:({prefetch,children,...props}:{prefetch?:boolean|null;children:ReactNode})=><a {...props} data-prefetch={prefetch===null?"auto":String(prefetch)}>{children}</a>}));
vi.mock("@/app/acceso/actions",()=>({salir:vi.fn()}));
import { IntentLink } from "@/components/intent-link";
import { ShellFrame } from "@/components/shell-frame";
import { AunorLoading } from "@/components/aunor-loading";
import { roles } from "@/lib/roles";

it.each(["mouseEnter","focus","touchStart"] as const)("prefetches only on %s intent",event=>{
  render(<IntentLink href="/aunor/contrato">Contrato</IntentLink>);
  const link=screen.getByRole("link");
  expect(link.getAttribute("data-prefetch")).toBe("false");
  fireEvent[event](link);
  expect(link.getAttribute("data-prefetch")).toBe("auto");
  expect(link.getAttribute("href")).toBe("/aunor/contrato");
});
it("preserves handlers and lets them cancel prefetch",()=>{
  const handler=vi.fn(e=>e.preventDefault());
  render(<IntentLink href="/aunor" onFocus={handler}>Panel</IntentLink>);
  fireEvent.focus(screen.getByRole("link"));
  expect(handler).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("link").getAttribute("data-prefetch")).toBe("false");
});
it("updates persistent Aunor navigation and back link for each route",()=>{
  mocks.path="/aunor";
  const {rerender}=render(<ShellFrame role={roles.aunor}>Contenido</ShellFrame>);
  expect(screen.queryByRole("link",{name:"Volver"})).toBeNull();
  mocks.path="/aunor/reemplazos/replacement-1";
  rerender(<ShellFrame role={roles.aunor}>Reemplazo</ShellFrame>);
  expect(screen.getByRole("link",{name:"Volver"}).getAttribute("href")).toBe("/aunor/contrato");
  expect(screen.getAllByRole("link",{name:"Contrato"}).every(a=>a.getAttribute("aria-current")==="page")).toBe(true);
  mocks.path="/aunor/actividades/activity-1";
  rerender(<ShellFrame role={roles.aunor}>Detalle</ShellFrame>);
  expect(screen.getByRole("link",{name:"Volver"}).getAttribute("href")).toBe("/aunor");
  expect(screen.queryByRole("link",{name:"Cuentas"})).toBeNull();
});
it("keeps Admin navigation independent from Aunor routing",()=>{
  mocks.path="/cuentas";
  render(<ShellFrame role={roles.admin} active="Cuentas">Cuentas</ShellFrame>);
  expect(screen.getAllByRole("link",{name:"Cuentas"}).every(a=>a.getAttribute("aria-current")==="page")).toBe(true);
  expect(screen.queryByRole("link",{name:"Contrato"})).toBeNull();
});
it("announces loading without inventing work data",()=>{
  render(<AunorLoading/>);
  expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
  expect(screen.getByRole("status").textContent).toContain("Cargando");
  expect(screen.queryByRole("button")).toBeNull();
});
it("announces navigation even before the loading shell is available",()=>{
  mocks.pending=true;
  render(<IntentLink href="/aunor/contrato">Contrato</IntentLink>);
  expect(screen.getByRole("status").textContent).toContain("Abriendo sección");
  mocks.pending=false;
});
