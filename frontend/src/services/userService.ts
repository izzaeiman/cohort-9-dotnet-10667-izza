import apiClient from './api';
import type { UserItem } from '../data/users';

export const userService = {
  /**
   * Fetch all user members from backend API
   */
  async getUsers(search?: string): Promise<UserItem[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const qs = params.toString();
    const response = await apiClient.get(qs ? '/users?' + qs : '/users');
    return response.data.map((u: any): UserItem => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.role === 'Administrator' ? 'Administrator' : 'Regular User') as 'Administrator' | 'Regular User',
      status: 'active',
      lastActive: 'Active now',
      avatar: u.role === 'Administrator' ? 'https://i.pravatar.cc/150?img=68' : 'https://i.pravatar.cc/150?img=33',
      department: u.role === 'Administrator' ? 'Management' : 'Development',
      phone: '+1 555-0199',
    }));
  },

  async inviteUser(data: Omit<UserItem, 'id' | 'status' | 'lastActive' | 'avatar'>): Promise<UserItem> {
    return {
      id: `mock-id-${Date.now()}`,
      ...data,
      status: 'pending',
      lastActive: 'Never',
      avatar: data.role === 'Administrator' ? 'https://i.pravatar.cc/150?img=68' : 'https://i.pravatar.cc/150?img=33',
    };
  },

  async updateUser(id: string, data: Partial<UserItem>): Promise<UserItem> {
    if (data.role) {
      await apiClient.put(`/users/${id}/role`, { role: data.role });
    }
    return {
      id,
      name: data.name || '',
      email: data.email || '',
      role: (data.role || 'Regular User') as 'Administrator' | 'Regular User',
      status: 'active',
      lastActive: 'Active now',
      avatar: data.role === 'Administrator' ? 'https://i.pravatar.cc/150?img=68' : 'https://i.pravatar.cc/150?img=33',
      department: data.department || 'Development',
      phone: data.phone || '+1 555-0199',
    };
  },

  async deleteUser(id: string): Promise<boolean> {
    return true;
  },
};
