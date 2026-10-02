import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Children, Suspense, isValidElement, type ReactNode } from "react";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), loadContract: vi.fn() }));
vi.mock("@/components/mobile-shell", () => ({
  requireRole: mocks.requireRole,
  MobileShell: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/app/aunor/actions", () => ({ getAunorWorkspaceAction: mocks.loadContract }));
vi.mock("@/components/admin-contract-center", () => ({ AdminContractCenter: () => null }));
import ContractPage from "@/app/contrato/page";
import { MobileShell } from "@/components/mobile-shell";
import { WorkspaceLoading } from "@/components/workspace-loading";

it("keeps the only contract fallback inside the authorized shell and main content", async () => {
  mocks.requireRole.mockResolvedValue({ id: "admin" });
  mocks.loadContract.mockClear();
  const page = await ContractPage({ searchParams: Promise.resolve({}) } as never);
  expect(page.type).toBe(MobileShell);
  const main = page.props.children;
  expect(main.type).toBe("main");
  const children = Children.toArray(main.props.children);
  expect(isValidElement(children[0]) && children[0].type).toBe("header");
  const boundary = children.find(node => isValidElement(node) && node.type === Suspense);
  expect(isValidElement<{ fallback: ReactNode }>(boundary) && isValidElement(boundary.props.fallback) && boundary.props.fallback.type).toBe(WorkspaceLoading);
  expect(mocks.loadContract).not.toHaveBeenCalled();
  expect(existsSync(resolve("app/contrato/loading.tsx"))).toBe(false);
  expect(existsSync(resolve("app/loading.tsx"))).toBe(false);
});

it("does not render a shell or query contract data when authorization fails", async () => {
  mocks.requireRole.mockRejectedValueOnce(new Error("unauthorized"));
  mocks.loadContract.mockClear();
  await expect(ContractPage({ searchParams: Promise.resolve({}) } as never)).rejects.toThrow("unauthorized");
  expect(mocks.loadContract).not.toHaveBeenCalled();
});
