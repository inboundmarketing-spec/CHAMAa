import type { InteractiveButton } from '../interfaces/whatsapp-provider.interface';

export type DevChatMessageType =
  | 'text'
  | 'buttons'
  | 'list'
  | 'image'
  | 'video'
  | 'template';

export type DevChatEntry = {
  to: string;
  direction: 'in' | 'out';
  type: DevChatMessageType;
  at: Date;
  body?: string;
  buttons?: InteractiveButton[];
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
