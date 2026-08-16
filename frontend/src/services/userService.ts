import apiClient from './api';
import type { UserItem } from '../data/users';

export const userService = {
  /**
   * Fetch all user members from backend API
   */
  async getUsers(): Promise<UserItem[]> {
    const response = await apiClient.get('/users');
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

  /**
   * Invite a new user member (Mock fallback)
   */
  async inviteUser(data: Omit<UserItem, 'id' | 'status' | 'lastActive' | 'avatar'>): Promise<UserItem> {
    const newUser: UserItem = {
      ...data,
      id: `usr-${Math.floor(Math.random() * 1000)}`,
      status: 'pending',
      lastActive: 'Invited',
      avatar: 'https://i.pravatar.cc/150?img=12',
    };
    return newUser;
  },

  /**
   * Update user details (Mock fallback)
   */
  async updateUser(id: string, data: Partial<UserItem>): Promise<UserItem> {
    return {
      id,
      name: data.name || '',
      email: data.email || '',
      role: (data.role || 'Regular User') as 'Administrator' | 'Regular User',
      status: data.status || 'active',
      lastActive: 'Active now',
      avatar: 'https://i.pravatar.cc/150?img=33',
      department: data.department || 'Development',
      phone: data.phone || '+1 555-0199',
    };
  },

  /**
   * Delete a user member (Mock fallback)
   */
  async deleteUser(id: string): Promise<boolean> {
    return true;
  },
};
