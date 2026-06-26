export type ChatMessage = {
  to: string;
  direction: 'in' | 'out';
  type: 'text' | 'buttons' | 'list' | 'image' | 'video' | 'template';
  at: string;
  body?: string;
  buttons?: { id: string; title: string }[];
  listButton?: string;
  sections?: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[];
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  templateName?: string;
};
