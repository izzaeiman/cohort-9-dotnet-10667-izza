import { describe, it, expect, vi, beforeEach } from "vitest";
import { taskService } from "./taskService";
import apiClient from "./api";

vi.mock("./api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}));

const mockBackendTask = { id: 1, title: "Test Task", description: "Test Desc", status: "Pending", priority: "Medium", category: "Backend", dueDate: "2026-08-30T00:00:00Z", assignedUserId: "usr-1", assignedUserName: "John Doe", createdAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-02T00:00:00Z" };

describe("taskService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getAllTasks", () => {
    it("should fetch tasks and map to frontend format", async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: [mockBackendTask] });
      const tasks = await taskService.getAllTasks();
      expect(apiClient.get).toHaveBeenCalledWith("/tasks");
      expect(tasks[0].id).toBe("TSK-1");
    });

    it("should apply filters correctly", async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: [] });
      await taskService.getAllTasks({ search: "test", status: "in_progress", priority: "high", category: "Backend", assignedUserId: "1", dueDateFrom: "2026-01-01", dueDateTo: "2026-12-31" });
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("search=test"));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("status=InProgress"));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("priority=High"));
    });
    
    it("should handle different filter mappings", async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: [] });
      await taskService.getAllTasks({ status: "completed", priority: "low" });
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("status=Completed"));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("priority=Low"));

      (apiClient.get as any).mockResolvedValueOnce({ data: [] });
      await taskService.getAllTasks({ status: "cancelled", priority: "critical" });
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("status=Cancelled"));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("priority=Critical"));
      
      (apiClient.get as any).mockResolvedValueOnce({ data: [] });
      await taskService.getAllTasks({ status: "pending", priority: "medium" });
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("status=Pending"));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("priority=Medium"));
    });
  });

  describe("getTaskById", () => {
    it("should fetch and map a single task", async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: mockBackendTask });
      const task = await taskService.getTaskById("TSK-1");
      expect(task?.id).toBe("TSK-1");
    });
    
    it("should return null for invalid task ID", async () => {
      expect(await taskService.getTaskById("TSK-invalid")).toBeNull();
    });

    it("should return null if API fails", async () => {
      (apiClient.get as any).mockRejectedValueOnce(new Error("Network error"));
      expect(await taskService.getTaskById("TSK-1")).toBeNull();
    });
  });

  describe("createTask", () => {
    it("should post mapped task and return created task", async () => {
      (apiClient.post as any).mockResolvedValueOnce({ data: mockBackendTask });
      const newTask = { title: "Test", status: "in_progress" as any, priority: "high" as any, category: "Backend" as any, dueDate: "2026-08-30", description: "", assignedUser: "", assignedUserId: "", project: "", startDate: "", startTime: "", dueTime: "", timeLimit: 0 };
      const result = await taskService.createTask(newTask);
      expect(apiClient.post).toHaveBeenCalled();
      expect(result.id).toBe("TSK-1");
    });
    
    it("should handle other mappings in create", async () => {
      (apiClient.post as any).mockResolvedValueOnce({ data: mockBackendTask });
      const newTask2 = { title: "Test2", status: "completed" as any, priority: "low" as any, category: "Frontend" as any, dueDate: "2026-08-30", description: "desc", assignedUser: "", assignedUserId: "1", project: "", startDate: "", startTime: "", dueTime: "", timeLimit: 0 };
      await taskService.createTask(newTask2);
      expect(apiClient.post).toHaveBeenCalled();

      (apiClient.post as any).mockResolvedValueOnce({ data: mockBackendTask });
      const newTask3 = { title: "Test3", status: "cancelled" as any, priority: "critical" as any, category: "Design" as any, description: "", assignedUser: "", project: "", startDate: "", startTime: "", dueTime: "", timeLimit: 0, dueDate: "2026-08-30", assignedUserId: "1" };
      await taskService.createTask(newTask3);
    });
  });

  describe("updateTask", () => {
    it("should get current, put updated, and return new task", async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: mockBackendTask });
      (apiClient.put as any).mockResolvedValueOnce({ data: { ...mockBackendTask, title: "Updated" } });
      const result = await taskService.updateTask("TSK-1", { title: "Updated", status: "completed", priority: "low" });
      expect(result.title).toBe("Updated");
    });

    it("should handle other mapping values in update", async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: mockBackendTask });
      (apiClient.put as any).mockResolvedValueOnce({ data: mockBackendTask });
      await taskService.updateTask("TSK-1", { status: "in_progress", priority: "high", dueDate: "2026-01-01" });

      (apiClient.get as any).mockResolvedValueOnce({ data: mockBackendTask });
      (apiClient.put as any).mockResolvedValueOnce({ data: mockBackendTask });
      await taskService.updateTask("TSK-1", { status: "cancelled", priority: "critical", dueDate: "" });
    });

    it("should throw error for invalid ID", async () => {
      await expect(taskService.updateTask("TSK-invalid", {})).rejects.toThrow("Invalid task ID");
    });
  });

  describe("deleteTask", () => {
    it("should return true on success", async () => {
      (apiClient.delete as any).mockResolvedValueOnce({});
      expect(await taskService.deleteTask("TSK-1")).toBe(true);
    });
    
    it("should return false for invalid ID", async () => {
      expect(await taskService.deleteTask("TSK-invalid")).toBe(false);
    });

    it("should return false on API failure", async () => {
      (apiClient.delete as any).mockRejectedValueOnce(new Error("err"));
      expect(await taskService.deleteTask("TSK-1")).toBe(false);
    });
  });

  describe("assignTask", () => {
    it("should update assigned user", async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: mockBackendTask });
      (apiClient.put as any).mockResolvedValueOnce({ data: { ...mockBackendTask, assignedUserId: "usr-2" } });
      const result = await taskService.assignTask("TSK-1", "usr-2", "2026-01-01", "10:00", "2026-01-02", "11:00", 1);
      expect(result.assignees[0].id).toBe("usr-2");
    });
  });
  
  describe("subscribe", () => {
    it("should add listener and return unsubscribe function", () => {
      const listener = vi.fn();
      const unsubscribe = taskService.subscribe(listener);
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });
  });
});
