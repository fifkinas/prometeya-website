export type ServerMessage =
  | { type: 'ping' }
  | { type: 'new_qr'; session_id: string }
  | { type: 'auth_success'; worker_id: string } // <-- ЭТО ВАЖНО!
  | { type: 'print_processing'; message: string }
  | { type: 'print_success'; message: string }
  | { type: 'print_error'; message: string };

export type AppStep = 'QR_SCAN' | 'ROLE_SELECT' | 'AMOUNT_SELECT' | 'PRINTING' | 'RESULT';
export type Role = 'Пайщик' | 'Сварщик' | null;