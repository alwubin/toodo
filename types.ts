
export interface User {
  id: string; // Changed from number to string for UUID support
  nickname: string;
  profileImage: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  categoryId: string;
}

export interface DayTodoData {
  [dateKey: string]: TodoItem[];
}

export type ViewMode = 'calendar' | 'day';

// Standard iOS/Apple style red used for UI elements
export const DEFAULT_APPLE_RED = '#FF3B30';

// Fixed color for the default "기본 할 일" tag
export const FIXED_DEFAULT_COLOR = '#ffdd78';

export const PASTEL_COLORS = [
  '#A0C4FF', // Pastel Blue
  '#FFADAD', // Pastel Red
  '#CAFFBF', // Pastel Green
  '#FFD6A5', // Pastel Orange
  '#BDB2FF', // Pastel Purple
  '#FFC6FF', // Pastel Pink
  '#9BF6FF', // Pastel Teal
];
