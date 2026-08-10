import { INITIAL_USERS, type UserItem } from '../data/users';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let usersStore: UserItem[] = [...INITIAL_USERS];

export const userService = {
  /**
   * Fetch all user members
   */
  async getUsers(): Promise<UserItem[]> {
    // TODO: ASP.NET Core API Integration -> GET /api/users
    await delay();
    return [...usersStore];
  },

  /**
   * Invite a new user member
   */
  async inviteUser(data: Omit<UserItem, 'id' | 'status' | 'lastActive' | 'avatar'>): Promise<UserItem> {
    // TODO: ASP.NET Core API Integration -> POST /api/users/invite
    await delay();
    const newUser: UserItem = {
      ...data,
      id: `usr-${usersStore.length + 1}`,
      status: 'pending',
      lastActive: 'Invited',
      avatar: `https://i.pravatar.cc/150?img=${(usersStore.length % 50) + 12}`,
    };
    usersStore = [newUser, ...usersStore];
    return newUser;
  },

  /**
   * Update user details
   */
  async updateUser(id: string, data: Partial<UserItem>): Promise<UserItem> {
    // TODO: ASP.NET Core API Integration -> PUT /api/users/{id}
    await delay();
    const index = usersStore.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User ${id} not found`);
    }
    const updated = { ...usersStore[index], ...data };
    usersStore[index] = updated;
    return updated;
  },

  /**
   * Delete a user member
   */
  async deleteUser(id: string): Promise<boolean> {
    // TODO: ASP.NET Core API Integration -> DELETE /api/users/{id}
    await delay();
    const initialLength = usersStore.length;
    usersStore = usersStore.filter((u) => u.id !== id);
    return usersStore.length < initialLength;
  },
};
