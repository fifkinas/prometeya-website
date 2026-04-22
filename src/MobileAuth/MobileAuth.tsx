import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './MobileAuth.scss';

const API_BASE = 'http://192.168.0.100:8000/api/v1/auth';

type ViewState = 'register' | 'login_phone' | 'login_email';

export default function MobileAuth() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  // Изменили 'needs_registration' на 'needs_interaction', так как теперь тут не только регистрация
  const [status, setStatus] = useState<'checking' | 'needs_interaction' | 'success' | 'error'>(sessionId ? 'checking' : 'error');
  const [message, setMessage] = useState(sessionId ? '' : 'Неверный код сессии');
  const [workerNumber, setWorkerNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- НОВЫЕ СТЕЙТЫ ДЛЯ ЭКРАНОВ ---
  const [view, setView] = useState<ViewState>('login_phone'); // По умолчанию показываем вход по телефону
  const [contactInput, setContactInput] = useState(''); // Сюда пишем телефон ИЛИ почту при входе
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' });

  // 1. Проверка сессии при сканировании QR-кода
  useEffect(() => {
    if (!sessionId) return;

    fetch(`${API_BASE}/check?session_id=${sessionId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStatus('success');
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

  // 2. Логика РЕГИСТРАЦИИ (твой старый код)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setStatus('success');
        setWorkerNumber(data.worker_id);
        setMessage(`Добро пожаловать, ${formData.full_name}!`);
      } else {
        const errorMessage = data.message || (data.detail ? JSON.stringify(data.detail) : JSON.stringify(data));
        alert(`Ошибка сервера: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Ошибка при регистрации:', err);
      alert('Не удалось отправить данные');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. НОВАЯ: Логика ВХОДА (по телефону или email)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          contact_info: contactInput
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setStatus('success');
        setWorkerNumber(data.worker_id);
        setMessage(`С возвращением, ${data.worker_name}!`);
      } else {
        alert(data.message || 'Сотрудник не найден. Проверьте данные.');
      }
    } catch (err) {
      console.error('Ошибка при входе:', err);
      alert('Ошибка связи с сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- РЕНДЕР СТАТУСОВ (Загрузка, Ошибка, Успех) ---
  if (status === 'checking') return <div className="mobile-container">Загрузка...</div>;

  if (status === 'error') return (
    <div className="mobile-container">
        <div className="error-text">{message}</div>
    </div>
  );

  if (status === 'success') {
    return (
      <div className="mobile-container">
        <h1 className="success-title">Успех!</h1>
        <p className="welcome-text">{message}</p>

        {workerNumber && (
          <div className="number-block">
            <p className="label">Ваш личный номер:</p>
            <div className="huge-number">{workerNumber}</div>
            <p className="sub-label">Запомните его!</p>
          </div>
        )}
        <p className="tablet-hint">Посмотрите на экран планшета.</p>
      </div>
    );
  }

  // --- РЕНДЕР ФОРМ (Переключение экранов) ---
  return (
    <div className="mobile-container registration-view">

      {/* ЭКРАН 1: ВХОД ПО ТЕЛЕФОНУ */}
      {view === 'login_phone' && (
        <div className="form-wrapper">
          <h2 className="form-title">Вход в систему</h2>
          <form onSubmit={handleLoginSubmit} className="mobile-form">
            <input
              className="mobile-input"
              type="tel"
              placeholder="Номер телефона (+380...)"
              required
              disabled={isSubmitting}
              value={contactInput}
              onChange={e => setContactInput(e.target.value)}
            />
            <button className="mobile-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'ВХОД...' : 'ВОЙТИ'}
            </button>
          </form>

          <div className="bottom-links">
            <button onClick={() => { setView('login_email'); setContactInput(''); }} className="text-link">
              Войти по Email
            </button>
            <div className="divider"></div>
            <button onClick={() => setView('register')} className="text-link highlight">
              Новый сотрудник? Регистрация
            </button>
          </div>
        </div>
      )}

      {/* ЭКРАН 2: ВХОД ПО EMAIL */}
      {view === 'login_email' && (
        <div className="form-wrapper">
          <h2 className="form-title">Вход через Email</h2>
          <form onSubmit={handleLoginSubmit} className="mobile-form">
            <input
              className="mobile-input"
              type="email"
              placeholder="Ваш Email"
              required
              disabled={isSubmitting}
              value={contactInput}
              onChange={e => setContactInput(e.target.value)}
            />
            <button className="mobile-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'ВХОД...' : 'ВОЙТИ'}
            </button>
          </form>

          <div className="bottom-links">
            <button onClick={() => { setView('login_phone'); setContactInput(''); }} className="text-link">
              Вернуться к телефону
            </button>
          </div>
        </div>
      )}

      {/* ЭКРАН 3: РЕГИСТРАЦИЯ (Твоя старая форма) */}
      {view === 'register' && (
        <div className="form-wrapper">
          <h2 className="form-title">Новый сотрудник</h2>
          <form onSubmit={handleRegisterSubmit} className="mobile-form">
            <input
              className="mobile-input"
              type="text"
              placeholder="ФИО (Иванов И.И.)"
              required
              disabled={isSubmitting}
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
            <input
              className="mobile-input"
              type="email"
              placeholder="Email"
              required
              disabled={isSubmitting}
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
            <input
              className="mobile-input"
              type="tel"
              placeholder="Телефон (+380...)"
              required
              disabled={isSubmitting}
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
            <button className="mobile-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'ОТПРАВКА...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
            </button>
          </form>

          <div className="bottom-links single-link">
            <div className="divider"></div>
            <button onClick={() => setView('login_phone')} className="text-link highlight">
              Уже есть код? Назад ко входу
            </button>
          </div>
        </div>
      )}

    </div>
  );
}