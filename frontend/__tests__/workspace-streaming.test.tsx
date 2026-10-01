import { Children, Suspense, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ role: vi.fn(), contract: vi.fn(), activities: vi.fn() }));
vi.mock("@/components/mobile-shell", () => ({
  requireRole: mocks.role,
  MobileShell: ({ children }: { children: ReactNode }) => <div><nav aria-label="Menú principal">Navegación</nav>{children}</div>,
}));
vi.mock("@/app/aunor/actions", () => ({ getAunorWorkspaceAction: mocks.contract }));
vi.mock("@/lib/supabase/activities", () => ({ listSupabaseActivities: mocks.activities }));
vi.mock("@/lib/data-source", () => ({ resolveDataSource: () => "supabase" }));
vi.mock("@/components/admin-contract-center", () => ({ AdminContractCenter: () => <div>Contrato listo</div> }));
vi.mock("@/components/activity-dashboard", () => ({ ActivityDashboard: () => <div>Actividades listas</div> }));
import ContractPage from "@/app/contrato/page";
import ActivitiesPage from "@/app/actividades/page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.role.mockResolvedValue({id:"admin",label:"Admin"});
});
afterEach(cleanup);
const props = () => ({params:Promise.resolve({}),searchParams:Promise.resolve({mes:"2026-04"})});

// Inspect the RSC boundary without executing async server children in jsdom.
function initialShell(node: ReactNode, boundaries: ReactElement[]) : ReactNode {
  if (!isValidElement<{children?:ReactNode;fallback?:ReactNode}>(node)) return node;
  if (node.type === Suspense) { boundaries.push(node); return node.props.fallback; }
  return node.props.children === undefined ? node : cloneElement(node, undefined,
    Children.map(node.props.children, child => initialShell(child, boundaries)));
}

it.each(["contract","activities"])("%s muestra estructura tras autorizar sin esperar datos", async (route) => {
  const element = route === "contract" ? await ContractPage(props()) : await ActivitiesPage();
  expect(mocks.contract).not.toHaveBeenCalled();
  expect(mocks.activities).not.toHaveBeenCalled();
  const boundaries: ReactElement[] = [];
  render(initialShell(element,boundaries));
  expect(screen.getByRole("navigation",{name:"Menú principal"})).toBeTruthy();
  expect(screen.getByRole("heading",{name:route === "contract" ? "Centro de contrato" : "Todas las actividades"})).toBeTruthy();
  expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
  expect(boundaries).toHaveLength(1);
  mocks.contract.mockResolvedValue({ok:true,data:{}});
  mocks.activities.mockResolvedValue([]);
  const child = (boundaries[0].props as {children:ReactElement}).children;
  const content = await (child.type as (p:unknown)=>Promise<ReactElement>)(child.props);
  if(route === "contract") {
    expect(mocks.contract).toHaveBeenCalledWith({scene:"acordado"});
    expect((content.props as {initialMonth:string}).initialMonth).toBe("2026-04");
  } else expect(mocks.activities).toHaveBeenCalledOnce();
});

it("no renderiza estructura privada ni lee datos si la autorización falla", async () => {
  mocks.role.mockRejectedValue(new Error("redirect"));
  await expect(ContractPage(props())).rejects.toThrow("redirect");
  await expect(ActivitiesPage()).rejects.toThrow("redirect");
  expect(mocks.contract).not.toHaveBeenCalled();
  expect(mocks.activities).not.toHaveBeenCalled();
});
