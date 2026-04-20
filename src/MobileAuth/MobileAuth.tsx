import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './MobileAuth.scss';

const API_BASE = 'http://192.168.0.100:8000/api/v1/auth';

export default function MobileAuth() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [status, setStatus] = useState<'checking' | 'needs_registration' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [workerNumber, setWorkerNumber] = useState('');

  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' });

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('Неверный код сессии');
      return;
    }

    fetch(`${API_BASE}/check?session_id=${sessionId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setStatus('success');
          setMessage(`С возвращением, ${data.worker_name}!`);
        } else if (data.status === 'not_authorized') {
          setStatus('needs_registration');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('checking');

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
      } else {
        setStatus('needs_registration');
        alert(data.message);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Не удалось отправить данные');
    }
  };

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

  return (
    <div className="mobile-container registration-view">
      <h2 className="form-title">Новый сотрудник</h2>
      <form onSubmit={handleSubmit} className="mobile-form">
        <input
          className="mobile-input"
          type="text"
          placeholder="ФИО (Иванов И.И.)"
          required
          value={formData.full_name}
          onChange={e => setFormData({...formData, full_name: e.target.value})}
        />
        <input
          className="mobile-input"
          type="email"
          placeholder="Email"
          required
          value={formData.email}
          onChange={e => setFormData({...formData, email: e.target.value})}
        />
        <input
          className="mobile-input"
          type="tel"
          placeholder="Телефон (+380...)"
          required
          value={formData.phone}
          onChange={e => setFormData({...formData, phone: e.target.value})}
        />
        <button className="mobile-submit" type="submit">ЗАРЕГИСТРИРОВАТЬСЯ</button>
      </form>
    </div>
  );
}