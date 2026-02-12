// ==================== ENUMS ====================

export type TaskStatus = 'todo' | 'in-progress' | 'waiting' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';
export type GoalPriority = 'low' | 'medium' | 'high';
export type NoteImportance = 'low' | 'medium' | 'high';

export interface AccentColors {
  50: string;  // lightest
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // main
  600: string;
  700: string; // darkest
}

export interface CustomPalette {
  id: string;
  name: string;
  colors: AccentColors;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'Yapılacak',
  'in-progress': 'Devam Ediyor',
  'waiting': 'Beklemede',
  'done': 'Tamamlandı',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

export const TASK_TAGS = ['İş', 'Kişisel', 'Okul', 'Sağlık', 'Ev', 'Alışveriş', 'Spor', 'Hobi'] as const;
export type TaskTag = typeof TASK_TAGS[number];

export const EXPENSE_CATEGORIES = [
  'Kira', 'Market', 'Ulaşım', 'Eğlence', 'Sağlık', 'Eğitim',
  'Giyim', 'Faturalar', 'Yemek', 'Abonelikler', 'Diğer'
] as const;

export const INCOME_CATEGORIES = [
  'Maaş', 'Freelance', 'Yatırım', 'Hediye', 'İade', 'Diğer'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];

// ==================== INTERFACES ====================

export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string | null;
  parentId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  progress: number; // 0-100
  repeatRule: RepeatRule;
  dependsOn: string | null;
  archived: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  paymentMethod: PaymentMethod;
  repeatRule: RepeatRule;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  targetDate: string | null;
  monthlyPlanAmount: number | null;
  priority: GoalPriority;
  createdAt: string;
  updatedAt: string;
}

export interface GoalTransaction {
  id: string;
  goalId: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  date: string;
  note: string;
}

export interface TaskNote {
  id: string;
  taskId: string;
  content: string;
  color: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  importance: NoteImportance;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  datetime: string;
  repeatRule: RepeatRule;
  linkedType: 'task' | 'goal' | 'note' | null;
  linkedId: string | null;
  completed: boolean;
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  monthlyIncomeEstimate: number;
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
  };
  onboardingCompleted: boolean;
  accentPalette: string; // palette id or preset name
  customPalettes: CustomPalette[];
}

// ==================== STORE STATE ====================

export interface AppState {
  projects: Project[];
  tasks: Task[];
  transactions: Transaction[];
  goals: Goal[];
  goalTransactions: GoalTransaction[];
  notes: Note[];
  reminders: Reminder[];
  taskNotes: TaskNote[];
  settings: AppSettings;

  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'archived' | 'orderIndex'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string) => void;
  restoreTask: (id: string) => void;
  moveTask: (taskId: string, newParentId: string | null) => void;
  autoCompleteParent: (childId: string) => void;

  // Task Note actions
  addTaskNote: (note: Omit<TaskNote, 'id' | 'createdAt'>) => void;
  updateTaskNote: (id: string, data: Partial<TaskNote>) => void;
  deleteTaskNote: (id: string) => void;

  // Transaction actions
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalTransaction: (gt: Omit<GoalTransaction, 'id'>) => void;

  // Note actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Reminder actions
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, data: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;

  // Settings
  updateSettings: (s: Partial<AppSettings>) => void;

  // Seed
  seedData: () => Promise<void>;
  clearData: () => Promise<void>;
}
