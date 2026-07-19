export type Category = 'video-editing' | 'motion-graphics' | 'ai-creation';

export interface Project {
  id: string;
  title: string;
  category: Category;
  role: string;
  client: string;
  year: number;
  tools: string[];
  video: string;
  logo?: string;
  /** Optional lighter source for the wall tile (detail page can use the heavier `video`). */
  wall?: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  'video-editing': 'Video Editing',
  'motion-graphics': 'Motion Graphics',
  'ai-creation': 'AI Creation',
};
