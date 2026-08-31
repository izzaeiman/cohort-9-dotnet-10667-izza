import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ProtectedLayout } from "./ProtectedLayout";
import { MemoryRouter } from "react-router-dom";
import * as UseAuthModule from "../../hooks/useAuth";

// Mock the components used inside ProtectedLayout to simplify testing
vi.mock("./MainLayout", () => ({ default: () => <div data-testid="main-layout" /> }));

// Mock react-router Outlet and Navigate
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />
  };
});

describe("ProtectedLayout", () => {
  it("should render navigate to login if not authenticated", () => {
    vi.spyOn(UseAuthModule, "useAuth").mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      hasRole: vi.fn(),
      isAdmin: vi.fn(),
      isMember: vi.fn(),
      updateUserAvatar: vi.fn(),
    });
    
    const { getByTestId } = render(
      <MemoryRouter>
        <ProtectedLayout />
      </MemoryRouter>
    );
    
    expect(getByTestId("navigate").getAttribute("data-to")).toBe("/login");
  });

  it("should render main layout if authenticated", () => {
    vi.spyOn(UseAuthModule, "useAuth").mockReturnValue({
      user: { id: "1", name: "User", email: "user@example.com", role: "Regular User", avatar: "", department: "" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      hasRole: vi.fn(),
      isAdmin: vi.fn(),
      isMember: vi.fn(),
      updateUserAvatar: vi.fn(),
    });
    
    const { getByTestId, queryByTestId } = render(
      <MemoryRouter>
        <ProtectedLayout />
      </MemoryRouter>
    );
    
    expect(queryByTestId("navigate")).toBeNull();
    expect(getByTestId("main-layout")).toBeDefined();
  });
});
