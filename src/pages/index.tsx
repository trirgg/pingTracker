// pages/index.tsx
import { useEffect, useRef, useState } from 'react';

type LogEntry = { time: string; latency: number };
type StoredLog = { name: string; entries: LogEntry[] };

export default function Home() {
  const [ping, setPing] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [storedLogs, setStoredLogs] = useState<StoredLog[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audio.current = new Audio('/notif.mp3');
    loadStoredLogs();
  }, []);

  const loadStoredLogs = () => {
    const logs: StoredLog[] = [];
    for (let key in localStorage) {
      if (key.startsWith('log-')) {
        const entries = JSON.parse(localStorage.getItem(key) || '[]');
        logs.push({ name: key, entries });
      }
    }
    logs.sort((a, b) => (a.name < b.name ? 1 : -1)); // sort desc
    setStoredLogs(logs);
  };

  const startTracking = () => {
    setIsRunning(true);
    startTimeRef.current = new Date();
    setLog([]);
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/ping');
        const data = await res.json();
        setPing(data.latency);

        const timestamp = new Date().toLocaleTimeString();
        const newLog = { time: timestamp, latency: data.latency };
        setLog((prev) => [newLog, ...prev]); // baru (terbaru di atas)

        if (data.latency > 150 && audio.current) {
          audio.current.play();
        }
      } catch {
        setPing(null);
      }
    }, 3000);
  };

  const stopTracking = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    saveLogToLocalStorage();
  };

  const saveLogToLocalStorage = () => {
    if (!startTimeRef.current || log.length === 0) return;
    const date = new Date();
    const name = `log-${date.toISOString().replace(/:/g, '-').replace(/\..+/, '')}`;
    localStorage.setItem(name, JSON.stringify(log));
    loadStoredLogs();
  };

  const deleteAllLogs = () => {
    const keysToDelete = Object.keys(localStorage).filter((key) =>
      key.startsWith('log-')
    );
    keysToDelete.forEach((key) => localStorage.removeItem(key));
    setStoredLogs([]);
  };

  return (
    <main className="min-h-screen p-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">📶 HP Ping Tracker</h1>

      <div className="mb-4 space-x-4">
        <button
          onClick={startTracking}
          disabled={isRunning}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
        >
          ▶️ Start
        </button>
        <button
          onClick={stopTracking}
          disabled={!isRunning}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
        >
          ⏹ Stop
        </button>
        <button
          onClick={deleteAllLogs}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
        >
          🗑️ Hapus Semua Log
        </button>
      </div>

      <div className="mb-6 text-xl">
        Current Ping:{' '}
        <span className={ping && ping > 150 ? 'text-red-500' : 'text-green-400'}>
          {ping ?? 'N/A'} ms
        </span>
      </div>

      <h2 className="text-xl font-semibold mb-2">📜 Live Log</h2>
      <div className="max-h-[300px] overflow-y-auto border p-2 rounded bg-gray-800 mb-6">
        <ul>
          {log.map((item, idx) => (
            <li key={idx}>
              [{item.time}] - {item.latency} ms
            </li>
          ))}
        </ul>
      </div>

      <h2 className="text-xl font-semibold mb-2">💾 Log Tersimpan</h2>
      {storedLogs.length === 0 ? (
        <p className="text-gray-400">Belum ada log tersimpan.</p>
      ) : (
        <div className="space-y-2">
          {storedLogs.map((log) => (
            <details key={log.name} className="bg-gray-800 p-2 rounded">
              <summary className="cursor-pointer font-mono">{log.name}</summary>
              <ul className="text-sm mt-2 max-h-[150px] overflow-y-auto">
                {log.entries.map((entry, idx) => (
                  <li key={idx}>
                    [{entry.time}] - {entry.latency} ms
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}
