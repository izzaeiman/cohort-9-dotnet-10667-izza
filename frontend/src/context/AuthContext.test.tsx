import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

// Mock authService
vi.mock("../services/authService", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
  }
}));

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with values from authService", () => {
    const mockUser = { id: "1", name: "User", email: "test@example.com", role: "Administrator" };
    (authService.getCurrentUser as any).mockReturnValue(mockUser);
    (authService.isAuthenticated as any).mockReturnValue(true);
    
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useAuth();
      return null;
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(contextValue.user).toEqual(mockUser);
    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.isAdmin()).toBe(true);
    expect(contextValue.isMember()).toBe(false);
  });

  it("should update state on login", async () => {
    (authService.getCurrentUser as any).mockReturnValue(null);
    (authService.isAuthenticated as any).mockReturnValue(false);
    
    const mockUser = { id: "1", name: "User", email: "test@example.com", role: "Regular User" };
    (authService.login as any).mockResolvedValue(mockUser);
    
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useAuth();
      return null;
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(contextValue.isAuthenticated).toBe(false);
    
    await act(async () => {
      await contextValue.login({ email: "test@example.com", password: "Password123!", rememberMe: false });
    });
    
    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.user).toEqual(mockUser);
    expect(contextValue.isAdmin()).toBe(false);
    expect(contextValue.isMember()).toBe(true);
  });

  it("should update state on signup", async () => {
    (authService.getCurrentUser as any).mockReturnValue(null);
    (authService.isAuthenticated as any).mockReturnValue(false);
    
    const mockUser = { id: "1", name: "User", email: "test@example.com", role: "Regular User" };
    (authService.signup as any).mockResolvedValue(mockUser);
    
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useAuth();
      return null;
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await act(async () => {
      await contextValue.signup({ name: "User", email: "test@example.com", password: "Password123!", confirmPassword: "Password123!" });
    });
    
    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.user).toEqual(mockUser);
  });

  it("should clear state on logout", async () => {
    const mockUser = { id: "1", name: "User", email: "test@example.com", role: "Regular User" };
    (authService.getCurrentUser as any).mockReturnValue(mockUser);
    (authService.isAuthenticated as any).mockReturnValue(true);
    
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useAuth();
      return null;
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(contextValue.isAuthenticated).toBe(true);
    
    await act(async () => {
      await contextValue.logout();
    });
    
    expect(contextValue.isAuthenticated).toBe(false);
    expect(contextValue.user).toBeNull();
  });

  it("should update user avatar and local storage", async () => {
    const setItemMock = vi.fn();
    const mockUser = { id: "1", name: "User", email: "test@example.com", role: "Regular User", avatar: "old" };
    
    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockUser)),
        setItem: setItemMock,
        removeItem: vi.fn(),
      },
      writable: true,
    });

    (authService.getCurrentUser as any).mockReturnValue(mockUser);
    (authService.isAuthenticated as any).mockReturnValue(true);
    
    let contextValue: any;
    
    const TestComponent = () => {
      contextValue = useAuth();
      return null;
    };
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      contextValue.updateUserAvatar("new_avatar");
    });
    
    expect(contextValue.user.avatar).toBe("new_avatar");
    expect(setItemMock).toHaveBeenCalledWith("workflow_user", expect.stringContaining("new_avatar"));
  });
});
