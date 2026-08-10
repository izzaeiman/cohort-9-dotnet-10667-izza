export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Regular User' | 'Software Engineer' | 'UI/UX Designer' | 'DevOps Lead';
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
    bio: 'Lead Fullstack Architect specializing in React 19, TypeScript, and ASP.NET Core Web API.',
  },
  {
    id: 'usr-2',
    name: 'Ali Khan',
    email: 'ali.khan@example.com',
    role: 'Software Engineer',
    department: 'Frontend Engineering',
    phone: '+92 301 9876543',
    status: 'active',
    lastActive: '15 mins ago',
    avatar: 'https://i.pravatar.cc/150?img=33',
    bio: 'Frontend Engineer focused on modern React interfaces, accessibility, and state management.',
  },
  {
    id: 'usr-3',
    name: 'Sara Ahmed',
    email: 'sara.ahmed@example.com',
    role: 'UI/UX Designer',
    department: 'Product Design',
    phone: '+92 302 4567890',
    status: 'active',
    lastActive: '1 hour ago',
    avatar: 'https://i.pravatar.cc/150?img=32',
    bio: 'Product Designer creating harmonious color palettes, dark themes, and responsive design systems.',
  },
  {
    id: 'usr-4',
    name: 'Ahmed Raza',
    email: 'ahmed.raza@example.com',
    role: 'Regular User',
    department: 'Backend Engineering',
    phone: '+92 303 6543210',
    status: 'offline',
    lastActive: 'Yesterday',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Database specialist specializing in SQL Server schema design, EF Core migrations, and query tuning.',
  },
  {
    id: 'usr-5',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    role: 'DevOps Lead',
    department: 'Infrastructure & Cloud',
    phone: '+92 304 1122334',
    status: 'active',
    lastActive: '3 hours ago',
    avatar: 'https://i.pravatar.cc/150?img=59',
    bio: 'Cloud Infrastructure engineer responsible for Docker containerization and Azure pipelines.',
  },
];
