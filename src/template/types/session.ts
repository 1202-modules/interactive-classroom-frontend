export type SessionStatus = 'active' | 'archive' | 'trash';

export interface Session {
  id: number;
  workspace_id: number;
  name: string;
  status: SessionStatus;
  is_stopped: boolean;
  passcode: string;
  participant_count: number;
  started_at: string | null;
  created_at: string;
  updated_at: string;
}



