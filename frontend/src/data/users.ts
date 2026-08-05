export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Regular User';
  department: string;
  phone: string;
  status: 'active' | 'offline' | 'pending';
  lastActive: string;
  avatar: string;
  bio?: string;
}

export const INITIAL_USERS: UserItem[] = [
  {
    id: 'usr-1',
    name: 'Izza Eiman',
    email: 'izzaeiman@yahoo.com',
    role: 'Administrator',
    department: 'Fullstack Engineering',
    phone: '+92 300 1234567',
    status: 'active',
    lastActive: 'Just now',
    avatar: 'https://i.pravatar.cc/150?img=68',
    bio: 'Senior Fullstack Engineer specializing in React 19, TypeScript, and ASP.NET Core Web API architecture.',
  },
  {
    id: 'usr-2',
    name: 'John Smith (Mentor)',
    email: 'john.smith@example.com',
    role: 'Administrator',
    department: 'Tech Lead / Reviewer',
    phone: '+1 (555) 012-3456',
    status: 'active',
    lastActive: '15 mins ago',
    avatar: 'https://i.pravatar.cc/150?img=33',
    bio: 'Lead Architect & Mentor for 10Pearls Shine Cohort 9 Internship Program.',
  },
  {
    id: 'usr-3',
    name: 'Alice Carter',
    email: 'alice@example.com',
    role: 'Regular User',
    department: 'UI/UX Design',
    phone: '+1 (555) 014-9876',
    status: 'active',
    lastActive: '1 hour ago',
    avatar: 'https://i.pravatar.cc/150?img=32',
    bio: 'Product Designer focusing on glassmorphic design systems, micro-interactions, and accessibility.',
  },
  {
    id: 'usr-4',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'Regular User',
    department: 'Backend Engineering',
    phone: '+1 (555) 017-6543',
    status: 'offline',
    lastActive: 'Yesterday',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Database specialist working with Entity Framework Core, SQL Server schema design, and Dapper.',
  },
  {
    id: 'usr-5',
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    role: 'Regular User',
    department: 'DevOps & Cloud',
    phone: '+1 (555) 018-4321',
    status: 'active',
    lastActive: '3 hours ago',
    avatar: 'https://i.pravatar.cc/150?img=59',
    bio: 'Cloud Infrastructure & CI/CD pipeline automation engineer for Azure and Docker deployments.',
  },
  {
    id: 'usr-6',
    name: 'Diana Evans',
    email: 'diana@example.com',
    role: 'Regular User',
    department: 'QA & Testing',
    phone: '+1 (555) 011-8765',
    status: 'pending',
    lastActive: 'Invited',
    avatar: 'https://i.pravatar.cc/150?img=47',
    bio: 'Automated testing engineer for xUnit, Playwright, and Selenium integration test suites.',
  },
];
