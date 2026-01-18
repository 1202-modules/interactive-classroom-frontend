// Participant types
export type Participant = {
  id: number;
  name: string;
  joined_at: string;
  is_active: boolean;
  auth_type: 'anonymous' | 'registered' | 'sso' | 'email';
};

// Session module (в сессии)
export type SessionModule = {
  id: string; // unique id для dnd
  module_id: number; // ref к workspace module
  order: number;
  is_active: boolean;
  name: string;
  type: 'questions' | 'poll' | 'quiz' | 'timer';
  config: any; // copied from workspace module
};

// Полная информация о сессии для админ-панели
export type SessionDetail = {
  id: number;
  workspace_id: number;
  name: string;
  passcode: string;
  is_stopped: boolean;
  participants_count: number;
  active_module_id: string | null;
  session_modules: SessionModule[];
  created_at: string;
  started_at: string | null;
};

