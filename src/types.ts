export interface Skill {
  name: string;
  category: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  academic_bg: string;
  professional_history: string;
  skills: Skill[];
}

export interface Group {
  id: number;
  name: string;
  description: string;
  admin_id: number;
}

export interface Idea {
  id: number;
  title: string;
  description: string;
  area: string;
  author_id: number;
  author_name?: string;
  group_id?: number;
  status: 'idea' | 'project';
  score?: number;
}

export interface Improvement {
    id: number;
    idea_id: number;
    author_id: number;
    author_name?: string;
    description: string;
    created_at: string;
}
