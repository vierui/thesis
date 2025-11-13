import { IconType } from "react-icons/lib";

export interface MessageProps {
  message_id?: string;
  type: string;
  message: string;
  thinking?: string;
  retrieved_docs?: DocumentProps[];
  sourceDocs?: DocumentProps[];
  liked?: boolean;
  disliked?: boolean;
  rating?: number;
  faithfulness?: number | null;
  answer_relevancy?: number | null;
  context_precision?: number | null;
  context_relevance?: number | null;
}

export interface DocumentProps {
  id: number;
  document_id?: string;
  document_name?: string;
  title: string;
  topic: string;
  content?: string; 
  page_number?: number;
  source?: string;
}

export interface SidebarItems {
  name: string;
  url: string;
  icon?: IconType;
}

export interface TableContentProps {
  id: string;
  user_id: string;
  title: string;
  public: Boolean;
  createdAt: string;
  file_size_formatted: string;
  tag: string;
  topic: string;
}

export interface UserProfileProps {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  img_url: string;
}
