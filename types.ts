
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum Category {
  WORK = 'Trabajo',
  PERSONAL = 'Personal',
  SHOPPING = 'Compras',
  HEALTH = 'Salud',
  OTHER = 'Otro'
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  dueDate: string;
  completed: boolean;
  createdAt: number;
  subtasks: SubTask[];
  reminderTime?: string; // ISO string for the scheduled reminder
}

export interface AIResponse {
  suggestions: string[];
}
