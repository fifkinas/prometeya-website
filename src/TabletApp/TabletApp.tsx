import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { ServerMessage, AppStep, Role } from '../types.ts';
import './TabletApp.scss'

// IP бэкенда (FastAPI)
const WS_URL = 'ws://192.168.0.100:8000/ws';
// IP фронтенда (React).
const FRONTEND_URL = 'http://192.168.0.100:5173';

export default function TabletApp() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [wsSessionId, setWsSessionId] = useState<string>('loading');
  const [currentStep, setCurrentStep] = useState<AppStep>('QR_SCAN');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [workerId, setWorkerId] = useState<string>('');
  const [role, setRole] = useState<Role>(null);
  const [amount, setAmount] = useState<number>(1);

  const wsRef = useRef<WebSocket | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetToStart = useCallback(() => {
    setCurrentStep('QR_SCAN');
    setWorkerId('');
    setRole(null);
    setAmount(1);
    setStatusMessage('');
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (currentStep !== 'QR_SCAN' && currentStep !== 'PRINTING' && currentStep !== 'RESULT') {
      inactivityTimerRef.current = setTimeout(resetToStart, 60000);
    }
  }, [currentStep, resetToStart]);

  useEffect(() => {
    globalThis.addEventListener('click', resetInactivityTimer);
    resetInactivityTimer();
    return () => globalThis.removeEventListener('click', resetInactivityTimer);
  }, [resetInactivityTimer]);

  const connectWebSocket = useCallback(function connect() {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ action: 'get_qr' }));
    };

    ws.onmessage = (event) => {
      const data: ServerMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ action: 'pong' }));
          break;
        case 'new_qr':
          setWsSessionId(data.session_id);
          break;
        case 'auth_success':
          setWorkerId(data.worker_id);
          setCurrentStep('ROLE_SELECT');
          break;
        case 'print_processing':
          setCurrentStep('PRINTING');
          setStatusMessage('Печатается...');
          break;
        case 'print_success':
          setCurrentStep('RESULT');
          setStatusMessage('Готово!');
          setTimeout(() => {
            ws.send(JSON.stringify({ action: 'get_qr' }));
            resetToStart();
          }, 5000);
          break;
        case 'print_error':
          setCurrentStep('RESULT');
          setStatusMessage(`Ошибка: ${data.message}`);
          setTimeout(resetToStart, 5000);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [resetToStart]);

  useEffect(() => {
    connectWebSocket();
    return () => wsRef.current?.close();
  }, [connectWebSocket]);

  const handlePrint = () => {
    if (!wsRef.current || !workerId || !role) return;
    wsRef.current.send(JSON.stringify({
      action: 'print',
      worker_id: workerId,
      role: role,
      amount: amount
    }));
  };

  return (
    <div className="app-container">
      {currentStep === 'QR_SCAN' && (
        <div className="screen">


          { isConnected ? (
              <>
                <div className="qr-container">
                  <QRCodeSVG value={`${FRONTEND_URL}/auth?session=${wsSessionId}`} size={300} />
                </div>
                <h2 style={{ color: '#aaa' }}>Отсканируйте код с телефона</h2>
              </>

            ) : (
                <div className="status-huge-text" style={{ color: '#f44336' }}>
                  ОЖИДАНИЕ СЕРВЕРА...
                </div>
          )}


        </div>
      )}

      {currentStep === 'ROLE_SELECT' && (
        <div className="screen">
          <h1 style={{ fontSize: '3rem', marginBottom: '50px' }}>Кто вы сегодня?</h1>
          <div className="role-grid">
            <button className="role-square role-solder" onClick={() => { setRole('Пайщик'); setCurrentStep('AMOUNT_SELECT'); }}>Пайщик</button>
            <button className="role-square role-welder" onClick={() => { setRole('Сварщик'); setCurrentStep('AMOUNT_SELECT'); }}>Сварщик</button>
          </div>
        </div>
      )}

      {currentStep === 'AMOUNT_SELECT' && (
        <div className="screen">
          <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#aaa' }}>Укажите количество</h1>
          <div className="amount-wrapper">
            <button className="circle-btn" onClick={() => setAmount(a => Math.max(1, a - 1))}>-</button>
            <div className="amount-display">{amount}</div>
            <button className="circle-btn" onClick={() => setAmount(a => a + 1)}>+</button>
          </div>
          <button className="print-btn" onClick={handlePrint}>РАСПЕЧАТАТЬ</button>
        </div>
      )}

      {currentStep === 'PRINTING' && (
        <div className="screen">
          <div className="status-huge-text" style={{ color: '#ffb300' }}>Печатается...</div>
        </div>
      )}

      {currentStep === 'RESULT' && (
        <div className="screen">
          <div className="status-huge-text" style={{ color: statusMessage === 'Готово!' ? '#4caf50' : '#f44336' }}>{statusMessage}</div>
        </div>
      )}

      <div className={`status-bar ${isConnected ? 'status-online' : 'status-offline'}`}>
        {isConnected ? 'СИСТЕМА АКТИВНА' : 'ОБРЫВ СВЯЗИ'}
      </div>
    </div>
  );
}