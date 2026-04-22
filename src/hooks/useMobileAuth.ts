import { useState, useEffect } from 'react';
import { authApi } from '../api/authService';

export type AuthStatus = 'checking' | 'needs_interaction' | 'success' | 'error';

export const useMobileAuth = (sessionId: string | null) => {
  const [status, setStatus] = useState<AuthStatus>(sessionId ? 'checking' : 'error');
  const [message, setMessage] = useState(sessionId ? '' : 'Неверный код сессии');
  const [workerNumber, setWorkerNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Проверка сессии при открытии ссылки
  useEffect(() => {
    if (!sessionId) return;

    authApi.checkSession(sessionId)
      .then(data => {
        if (data.status === 'success') {
          setStatus('success');
          setWorkerNumber(data.worker_id || '');
          setMessage(`С возвращением, ${data.worker_name}!`);
        } else if (data.status === 'not_authorized') {
          setStatus('needs_interaction');
        } else {
          setStatus('error');
          setMessage(data.message || 'Ошибка сессии');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Ошибка связи с сервером');
      });
  }, [sessionId]);

  // 2. Функция РЕГИСТРАЦИИ нового сотрудника
  const registerWorker = async (formData: { full_name: string; email: string; phone: string }) => {
    if (!sessionId) return;
    setIsSubmitting(true);

    try {
      const data = await authApi.register({ session_id: sessionId, ...formData });

      if (data.status === 'success') {
        setStatus('success');
        setWorkerNumber(data.worker_id);
        // Сообщение берем из ответа сервера, либо ставим свое
        setMessage(`Добро пожаловать, ${formData.full_name}!`);
      } else {
        // Если FastAPI вернул ошибку валидации (detail) или наше сообщение (message)
        const errorMessage = data.message || (data.detail ? JSON.stringify(data.detail) : 'Ошибка регистрации');
        alert(`Ошибка сервера: ${errorMessage}`);
      }
    } catch (err) {
      console.error(err);
      alert('Не удалось отправить данные');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Функция ВХОДА для существующего сотрудника
  const loginWorker = async (contactInfo: string) => {
    if (!sessionId) return;
    setIsSubmitting(true);

    try {
      const data = await authApi.login({ session_id: sessionId, contact_info: contactInfo });

      if (data.status === 'success') {
        setStatus('success');
        setWorkerNumber(data.worker_id);
        setMessage(`С возвращением, ${data.worker_name}!`);
      } else {
        alert(data.message || 'Сотрудник не найден. Проверьте номер или Email.');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка связи с сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { status, message, workerNumber, isSubmitting, registerWorker, loginWorker };
};