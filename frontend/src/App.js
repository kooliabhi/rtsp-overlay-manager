import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Rnd } from 'react-rnd';

const API_BASE = "http://127.0.0.1:5000";

function App() {
  const [overlays, setOverlays] = useState([]);
  const [rtspUrl, setRtspUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50); // Volume state (0-100)

  useEffect(() => {
    fetchOverlays();
  }, []);

  const fetchOverlays = async () => {
    try {
      const res = await axios.get(`${API_BASE}/overlays`);
      setOverlays(res.data);
    } catch (err) { console.error("Backend offline", err); }
  };

  const addOverlay = async (type) => {
    const message = type === 'text' ? "Enter Text:" : "Enter Image URL (e.g. https://via.placeholder.com/150):";
    const content = window.prompt(message);
    if (content === null || content.trim() === "") return; 

    const newOverlay = { type, content, x: 100, y: 100, width: 150, height: 100 };
    const res = await axios.post(`${API_BASE}/overlays`, newOverlay);
    setOverlays([...overlays, { ...newOverlay, _id: res.data._id }]);
  };

  const updateOverlay = async (id, updatedData) => {
    await axios.put(`${API_BASE}/overlays/${id}`, updatedData);
  };

  const deleteOverlay = async (id) => {
    await axios.delete(`${API_BASE}/overlays/${id}`);
    setOverlays(overlays.filter(o => o._id !== id));
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <h2>RTSP Stream Overlay Dashboard</h2>
      
      {/* Control Panel */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <input 
          placeholder="RTSP URL..." 
          style={{ padding: '8px', width: '250px' }}
          value={rtspUrl}
          onChange={(e) => setRtspUrl(e.target.value)}
        />
        <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '8px 15px', cursor: 'pointer' }}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        {/* Volume Control Requirement */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🔈</span>
          <input 
            type="range" min="0" max="100" 
            value={volume} 
            onChange={(e) => setVolume(e.target.value)} 
          />
          <span>{volume}%</span>
        </div>

        <button onClick={() => addOverlay('text')} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px' }}>+ Text Overlay</button>
        <button onClick={() => addOverlay('image')} style={{ backgroundColor: '#17a2b8', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px' }}>+ Image Overlay</button>
      </div>

      {/* Embedded Video Player */}
      <div style={{ 
        position: 'relative', width: '800px', height: '450px', 
        margin: '0 auto', backgroundColor: '#000', border: '6px solid #343a40',
        overflow: 'hidden' 
      }}>
        {isPlaying ? (
          <img 
            src={`${API_BASE}/video_feed?url=${encodeURIComponent(rtspUrl)}`} 
            alt="Stream" 
            style={{ width: '100%', height: '100%', pointerEvents: 'none', objectFit: 'contain' }} 
          />
        ) : (
          <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <h3>Click Play to start Livestream</h3>
          </div>
        )}

        {/* Overlay Manager Layer */}
        {isPlaying && overlays.map((o) => (
          <Rnd
            key={o._id}
            size={{ width: o.width, height: o.height }}
            position={{ x: o.x, y: o.y }}
            onDragStop={(e, d) => {
              const updated = { ...o, x: d.x, y: d.y };
              updateOverlay(o._id, updated);
              setOverlays(prev => prev.map(item => item._id === o._id ? updated : item));
            }}
            onResizeStop={(e, dir, ref, delta, pos) => {
              const updated = { ...o, width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos };
              updateOverlay(o._id, updated);
              setOverlays(prev => prev.map(item => item._id === o._id ? updated : item));
            }}
            bounds="parent"
            style={{ 
              border: '2px dashed yellow', 
              background: 'rgba(0,0,0,0.3)', 
              cursor: 'move',
              zIndex: 100
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Delete Button (The "Cancel/Clear" for this item) */}
              <button 
                onClick={(e) => { e.stopPropagation(); deleteOverlay(o._id); }} 
                style={{ position: 'absolute', top: '0', right: '0', background: 'red', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', zIndex: 110 }}
              >X</button>
              
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                {o.type === 'text' ? (
                  <span style={{ fontWeight: 'bold', padding: '5px' }}>{o.content}</span>
                ) : (
                  <img src={o.content} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="overlay"/>
                )}
              </div>
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
}

export default App;