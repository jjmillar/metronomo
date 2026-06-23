import { useState, useEffect } from 'react';

export default function SongManager({ currentSongId, onLoad, onNew }) {
  const [songs, setSongs] = useState([]);

  const refreshList = () => {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('song_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          list.push({ id: key, ...data });
        } catch (e) {
          // corrupt entry
        }
      }
    }
    list.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
    setSongs(list);
  };

  useEffect(() => {
    refreshList();
  }, [currentSongId]);

  return (
    <div className="songs-panel">
      <div className="panel-title">🎼 Canciones Guardadas</div>
      {songs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          No hay canciones guardadas
        </div>
      )}
      <div className="songs-list">
        <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 8 }} onClick={onNew}>
          ➕ Nueva Canción
        </button>
        {songs.map((s) => (
          <div
            key={s.id}
            className={`song-item ${s.id === currentSongId ? 'active' : ''}`}
            onClick={() => onLoad(s.id)}
          >
            <div>
              <div className="song-item-name">{s.name}</div>
              <div className="song-item-count">
                {(s.measures || []).length} compases ·{' '}
                {s.savedAt ? new Date(s.savedAt).toLocaleDateString() : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('¿Eliminar esta canción?')) {
                    localStorage.removeItem(s.id);
                    refreshList();
                  }
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
