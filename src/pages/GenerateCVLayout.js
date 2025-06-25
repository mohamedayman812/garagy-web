// src/pages/GenerateCVLayout.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GarageLayout.css';
import './SlotJsonGenerator.css';

export default function GenerateCVLayout() {
  const navigate = useNavigate();
  const canvasRef = useRef();
  const [imgSrc, setImgSrc]         = useState(null);
  const [currentPts, setCurrentPts] = useState([]);
  const [slots, setSlots]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [layout, setLayout]         = useState(null);
  const [error, setError]           = useState('');

  // draw image & polygons
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgSrc) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);

      // completed slots in green
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(76,175,80,0.8)';
      slots.forEach(slot => {
        ctx.beginPath();
        slot.points.forEach((p,i) => i===0?ctx.moveTo(...p):ctx.lineTo(...p));
        ctx.closePath();
        ctx.stroke();
      });

      // current polygon in red
      if (currentPts.length) {
        ctx.strokeStyle = 'rgba(244,67,54,0.8)';
        ctx.beginPath();
        currentPts.forEach((p,i) => i===0?ctx.moveTo(...p):ctx.lineTo(...p));
        ctx.stroke();
      }
    };
    img.src = imgSrc;
  }, [imgSrc, slots, currentPts]);

  const onImageUpload = e => {
    const f = e.target.files[0];
    if (!f) return;
    setImgSrc(URL.createObjectURL(f));
    setSlots([]);
    setCurrentPts([]);
    setLayout(null);
    setError('');
  };

  const onCanvasClick = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setCurrentPts(cp => [...cp, [x, y]]);
  };

  const completeSlot = () => {
    if (currentPts.length < 3) {
      alert('Please drop at least 3 points.');
      return;
    }
    setSlots(s => [...s, { id: `slot_${s.length+1}`, points: currentPts }]);
    setCurrentPts([]);
  };

  const submitAll = async () => {
    if (!imgSrc || slots.length === 0) {
      setError('Upload image & define at least one slot.');
      return;
    }
    setError('');
    setLoading(true);

    // rebuild File from blob URL
    const resp = await fetch(imgSrc);
    const blob = await resp.blob();
    const imageFile = new File([blob], 'garage.png', { type: blob.type });

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append(
      'slots',
      new Blob([JSON.stringify(slots)], { type: 'application/json' }),
      'slots.json'
    );

    try {
      const res = await fetch('http://localhost:5000/parking-detection', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();

      const sections = data.sections || [{
        id: 'A',
        name: 'Section A',
        slots: data.slots.map(s => ({
          id: s.slot_id,
          status: s.status  // "free" or "occupied"
        }))
      }];

      setLayout(sections);
    } catch (err) {
      console.error(err);
      setError('API error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // loading
  if (loading) {
    return (
      <div className="garage-layout-container">
        <div className="loading-message">Processing…</div>
      </div>
    );
  }

  // show generated layout
  if (Array.isArray(layout)) {
    return (
      <div className="garage-layout-container">
        <h2>Generated Layout</h2>
        <div className="layout-preview">
          <h3>CV Layout Preview</h3>
          <div className="sections-container">
            {layout.map(sec => (
              <div
                key={sec.id}
                className={`section ${sec.emergency ? 'emergency' : ''}`}
              >
                <h4>{sec.name} ({sec.slots.length} slots)</h4>
                <div className="slots-grid">
                  {sec.slots.map((slot, i) => (
                    <div
                      key={slot.id}
                      className={`slot ${
                        slot.status === 'free' ? 'available' : 'unavailable'
                      }`}
                    >
                      <span>Slot {i+1}</span>
                      <div className="status-indicator"/>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="footer-buttons">
          <button className="back-button" onClick={() => setLayout(null)}>
            Generate Again
          </button>
          <button className="cv-layout-button" onClick={() => navigate('/garage-layout')}>
            Back to Manual
          </button>
        </div>
      </div>
    );
  }

  // initial: upload & define
  return (
    <div className="garage-layout-container">
      <h2>Generate Layout</h2>
      <div className="layout-configuration">
        <div className="input-group">
          <label>Upload Garage Image</label>
          <input type="file" accept="image/*" onChange={onImageUpload} />
        </div>
        {imgSrc && (
          <>
            <div className="input-group">
              <label>Click on image to drop points for Slot #{slots.length+1}</label>
              <button
                type="button"
                className="action-button"
                onClick={completeSlot}
                disabled={currentPts.length < 3}
              >
                Complete Slot
              </button>
            </div>
            <div className="input-group">
              <button
                type="button"
                className="save-button"
                onClick={submitAll}
                disabled={slots.length === 0}
              >
                Submit & Generate Layout
              </button>
            </div>
          </>
        )}
        {error && <p style={{color:'#f44336', textAlign:'center'}}>{error}</p>}
      </div>

      {imgSrc && (
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="slot-canvas"
          onClick={onCanvasClick}
        />
      )}
    </div>
  );
}
