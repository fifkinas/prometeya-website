const API_BASE = 'http://192.168.0.100:8000/api/v1/auth';

export const authApi = {
  // Проверка, привязан ли уже кто-то к этой сессии
  checkSession: async (sessionId: string) => {
    const res = await fetch(`${API_BASE}/check?session_id=${sessionId}`, {
      credentials: 'include'
    });
    return res.json();
  },

  // Регистрация с ФИО, почтой и телефоном
  register: async (data: { session_id: string; full_name: string; email: string; phone: string }) => {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // НОВОЕ: Вход по номеру телефона ИЛИ почте
  login: async (data: { session_id: string; contact_info: string }) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  }
};