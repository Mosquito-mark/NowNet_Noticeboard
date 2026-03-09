export interface Group {
  id: number;
  name: string;
  description: string;
}

export interface Thread {
  id: number;
  group_id: number;
  title: string;
  author: string;
  created_at: string;
  post_count?: number;
}

export interface Post {
  id: number;
  thread_id: number;
  author: string;
  content: string;
  created_at: string;
}

export interface MicronetNode {
  userId: string;
  deviceName: string;
}

export type View = 'groups' | 'threads' | 'post' | 'chat' | 'help';
