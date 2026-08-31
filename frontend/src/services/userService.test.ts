import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import apiClient from './api';

vi.mock('./api', () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

const rawUser = {
  id: 'u1', name: 'Alice', email: 'alice@company.com', role: 'Administrator',
};

describe('userService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getUsers', () => {
    it('fetches users without search param', async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: [rawUser] });
      const users = await userService.getUsers();
      expect(apiClient.get).toHaveBeenCalledWith('/users');
      expect(users[0].role).toBe('Administrator');
      expect(users[0].avatar).toContain('img=68'); // admin avatar
      expect(users[0].department).toBe('Management');
    });

    it('fetches users with search param appended to URL', async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: [] });
      await userService.getUsers('alice');
      expect(apiClient.get).toHaveBeenCalledWith('/users?search=alice');
    });

    it('maps Regular User role correctly', async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: [{ ...rawUser, role: 'Regular User' }] });
      const users = await userService.getUsers();
      expect(users[0].role).toBe('Regular User');
      expect(users[0].avatar).toContain('img=33');
      expect(users[0].department).toBe('Development');
    });

    it('defaults unknown role to Regular User', async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: [{ ...rawUser, role: 'Unknown' }] });
      const users = await userService.getUsers();
      expect(users[0].role).toBe('Regular User');
    });
  });

  describe('inviteUser', () => {
    it('returns mock invited user with pending status', async () => {
      const result = await userService.inviteUser({
        name: 'Bob', email: 'bob@company.com', role: 'Regular User',
        department: 'Dev', phone: '+1 555-0101',
      });
      expect(result.status).toBe('pending');
      expect(result.lastActive).toBe('Never');
      expect(result.id).toMatch(/^mock-id-/);
      expect(result.avatar).toContain('img=33');
    });

    it('assigns admin avatar for Administrator role invite', async () => {
      const result = await userService.inviteUser({
        name: 'Admin', email: 'admin@co.com', role: 'Administrator',
        department: 'Mgmt', phone: '+1 555-0000',
      });
      expect(result.avatar).toContain('img=68');
    });
  });

  describe('updateUser', () => {
    it('calls PUT /users/:id/role when role is provided', async () => {
      (apiClient.put as any).mockResolvedValueOnce({});
      const result = await userService.updateUser('u1', { role: 'Administrator', name: 'Alice', email: 'alice@co.com' });
      expect(apiClient.put).toHaveBeenCalledWith('/users/u1/role', { role: 'Administrator' });
      expect(result.role).toBe('Administrator');
      expect(result.avatar).toContain('img=68');
    });

    it('does not call PUT when no role is provided', async () => {
      const result = await userService.updateUser('u1', { name: 'Alice', email: 'alice@co.com' });
      expect(apiClient.put).not.toHaveBeenCalled();
      expect(result.role).toBe('Regular User'); // default
    });

    it('uses provided department and phone', async () => {
      const result = await userService.updateUser('u1', { department: 'HR', phone: '+1-999-9999' });
      expect(result.department).toBe('HR');
      expect(result.phone).toBe('+1-999-9999');
    });
  });

  describe('deleteUser', () => {
    it('returns true (no-op stub)', async () => {
      const result = await userService.deleteUser('u1');
      expect(result).toBe(true);
    });
  });
});
