import React, { useState, useEffect, useRef } from 'react';
import JsSIP from 'jssip';
import { Phone, PhoneOff, UserCheck, Shield, Wifi, WifiOff } from 'lucide-react';
import './App.css';

export default function App() {
  const [domain, setDomain] = useState(import.meta.env.VITE_SIP_DOMAIN || 'localhost');
  const [wsServer, setWsServer] = useState(import.meta.env.VITE_SIP_WS_SERVER || 'wss://localhost:4443');
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('heslo123');
  const [targetUser, setTargetUser] = useState('bob');

  const [registered, setRegistered] = useState(false);
  const [uaStatus, setUaStatus] = useState('Odpojeno');
  const [callStatus, setCallStatus] = useState('IDLE');
  const [logs, setLogs] = useState([]);

  const uaRef = useRef(null);
  const sessionRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleRegister = () => {
    if (uaRef.current) {
      uaRef.current.stop();
    }

    try {
      const socket = new JsSIP.WebSocketInterface(wsServer);
      const configuration = {
        sockets: [socket],
        uri: `sip:${username}@${domain}`,
        password: password,
        session_timers: false,
        register_expires: 300,
      };

      addLog(`Připojování k ${wsServer} jako sip:${username}@${domain}...`);
      setUaStatus('Připojování...');

      const ua = new JsSIP.UA(configuration);

      ua.on('connecting', () => {
        setUaStatus('Připojování WebSocket...');
        addLog('WebSocket se připojuje...');
      });

      ua.on('connected', () => {
        setUaStatus('WebSocket připojen');
        addLog('WebSocket spojení navázáno.');
      });

      ua.on('disconnected', () => {
        setUaStatus('WebSocket odpojen');
        setRegistered(false);
        addLog('WebSocket spojení ztraceno.');
      });

      ua.on('registered', () => {
        setRegistered(true);
        setUaStatus('Zaregistrováno (Online)');
        addLog(`SIP účet úspěšně zaregistrován jako sip:${username}@${domain}`);
      });

      ua.on('unregistered', () => {
        setRegistered(false);
        setUaStatus('Odregistrováno');
        addLog('SIP účet odregistrován.');
      });

      ua.on('registrationFailed', (data) => {
        setRegistered(false);
        setUaStatus(`Registrace selhala: ${data.cause || 'Neznámá chyba'}`);
        addLog(`Chyba registrace: ${data.cause}`);
      });

      ua.on('newRTCSession', (data) => {
        const session = data.session;
        sessionRef.current = session;

        if (session.direction === 'incoming') {
          addLog(`Příchozí hovor od: ${session.remote_identity.uri.toString()}`);
          setCallStatus('Příchozí hovor...');

          // Automatické nebo manuální zvednutí
          const accept = window.confirm(`Příchozí hovor od ${session.remote_identity.display_name || session.remote_identity.uri.user}. Přijmout?`);
          if (accept) {
            setupSessionListeners(session);
            session.answer({
              mediaConstraints: { audio: true, video: false },
              pcConfig: {
                iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
              },
            });
            setCallStatus('Probíhá hovor');
          } else {
            session.terminate();
            setCallStatus('Odmítnuto');
          }
        } else {
          setupSessionListeners(session);
        }
      });

      ua.start();
      uaRef.current = ua;
    } catch (err) {
      addLog(`Chyba konfigurace: ${err.message}`);
      setUaStatus('Chyba');
    }
  };

  const setupSessionListeners = (session) => {
    session.on('peerconnection', (data) => {
      const pc = data.peerconnection;
      pc.ontrack = (event) => {
        addLog('Přiřazuji vzdálený audio stream...');
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch((e) => addLog(`Audio autoplay error: ${e.message}`));
        }
      };
    });

    session.on('connecting', () => {
      setCallStatus('Vytáčení...');
      addLog('Navazování spojení (ICE negotiation)...');
    });

    session.on('progress', () => {
      setCallStatus('Vyzvánění...');
      addLog('Vzdálená strana vyzvání...');
    });

    session.on('confirmed', () => {
      setCallStatus('Hovor spojen');
      addLog('Hovor úspěšně spojen!');
    });

    session.on('ended', () => {
      setCallStatus('Hovor ukončen');
      addLog('Hovor ukončen.');
      sessionRef.current = null;
    });

    session.on('failed', (data) => {
      setCallStatus(`Hovor selhal: ${data.cause}`);
      addLog(`Hovor selhal: ${data.cause}`);
      sessionRef.current = null;
    });
  };

  const handleCall = () => {
    if (!uaRef.current || !registered) {
      alert('Nejprve se prosím zaregistrujte do SIP serveru.');
      return;
    }

    const targetUri = targetUser.includes('@') ? `sip:${targetUser}` : `sip:${targetUser}@${domain}`;
    addLog(`Volám na ${targetUri}...`);
    setCallStatus('Vytáčím...');

    const eventHandlers = {
      // additional handlers if needed
    };

    const options = {
      eventHandlers,
      mediaConstraints: { audio: true, video: false },
      pcConfig: {
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
      },
    };

    try {
      const session = uaRef.current.call(targetUri, options);
      sessionRef.current = session;
      setupSessionListeners(session);
    } catch (err) {
      addLog(`Volání selhalo: ${err.message}`);
      setCallStatus('Chyba volání');
    }
  };

  const handleHangup = () => {
    if (sessionRef.current) {
      addLog('Pokládám hovor...');
      sessionRef.current.terminate();
      sessionRef.current = null;
      setCallStatus('Ukončeno');
    }
  };

  const handleUnregister = () => {
    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
      setRegistered(false);
      setUaStatus('Odpojeno');
      addLog('Uživatel odpojen ze serveru.');
    }
  };

  return (
    <div className="card">
      <header className="header">
        <h1>Kamailio WebRTC Klient</h1>
        <p className="subtitle">SIP přes WebSockets (JsSIP)</p>
        <div className={`status-badge ${registered ? 'online' : 'offline'}`}>
          {registered ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{uaStatus}</span>
        </div>
      </header>

      {/* Nastavení připojení */}
      <section className="section">
        <h2>1. SIP Přihlášení</h2>
        <div className="grid grid-2">
          <label>
            WSS Server:
            <input
              type="text"
              value={wsServer}
              onChange={(e) => setWsServer(e.target.value)}
              placeholder="wss://domena.duckdns.org:4443"
              disabled={registered}
            />
          </label>
          <label>
            SIP Doména:
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="domena.duckdns.org"
              disabled={registered}
            />
          </label>
        </div>

        <div className="grid grid-2">
          <label>
            SIP Uživatel:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alice"
              disabled={registered}
            />
          </label>
          <label>
            Heslo:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={registered}
            />
          </label>
        </div>

        <div className="actions">
          {!registered ? (
            <button className="btn btn-primary" onClick={handleRegister}>
              <UserCheck size={18} /> Zaregistrovat se
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={handleUnregister}>
              Odregistrovat
            </button>
          )}
        </div>
      </section>

      {/* Ovládání hovoru */}
      <section className="section">
        <h2>2. Hovory</h2>
        <div className="call-box">
          <label>
            Volat na (uživatel nebo SIP URI):
            <input
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="bob"
            />
          </label>

          <div className="call-actions">
            <button
              className="btn btn-success"
              onClick={handleCall}
              disabled={!registered || callStatus === 'Probíhá hovor' || callStatus === 'Hovor spojen'}
            >
              <Phone size={18} /> Call
            </button>
            <button
              className="btn btn-danger"
              onClick={handleHangup}
              disabled={!sessionRef.current}
            >
              <PhoneOff size={18} /> Hangup
            </button>
          </div>

          <div className="call-status">
            Stav hovoru: <strong>{callStatus}</strong>
          </div>
        </div>
      </section>

      {/* HTML5 Remote Audio element dle zadání */}
      <audio id="remoteAudio" ref={remoteAudioRef} autoPlay playsInline />

      {/* Záznam událostí */}
      <section className="section">
        <h2>3. Log událostí</h2>
        <div className="log-container">
          {logs.length === 0 ? (
            <div className="log-empty">Žádné události...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="log-entry">
                {log}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
