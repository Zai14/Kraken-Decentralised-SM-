import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Message = {
  id: string;
  conversation_id: string;
  sender: string;
  content: string;
  created_at: string;
  read: boolean;
  attachments?: Attachment[];
};

export type Conversation = {
  id: string;
  participants: string[];
  last_message: string | null;
  last_message_time: string;
  created_at: string;
  updated_at: string;
  is_group: boolean;
  group_name?: string;
  group_avatar?: string;
};

export type Attachment = {
  id: string;
  message_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
};

export const uploadFile = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(path, file);

  if (error) throw error;
  return data;
};

export const getFileUrl = (path: string) => {
  return supabase.storage.from('attachments').getPublicUrl(path).data.publicUrl;
};