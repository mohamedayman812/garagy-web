import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SlotJsonGenerator.css';

export default function SlotJsonGenerator() {
  const navigate = useNavigate();
  const canvasRef = useRef();
  const [imgSrc, setImgSrc] = useState(null);
  const [pointsList, setPointsList] = useState([]);
  const [currentPts, setCurrentPts] = useState([]);
  const [slotIdx, setSlotIdx] = useState(1);

  const onImage = e => {
    const f = e.target.files[0];
    if (!f) return;
    setImgSrc(URL.createObjectURL(f));
    setPointsList([]);
    setCurrentPts([]);
    setSlotIdx(1);
  };

  const onClickCanvas = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setCurrentPts(ps => [...ps, [x, y]]);
  };

  const completeSlot = () => {
    if (currentPts.length < 3) {
      alert('Need ≥3 points');
      return;
    }
    setPointsList(pl => [
      ...pl,
      { id: `slot_${pl.length+1}`, points: currentPts }
    ]);
    setCurrentPts([]);
    setSlotIdx(i => i + 1);
  };

  const downloadJSON = () => {
    const data = JSON.stringify(pointsList, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'slots.json';
    a.click();
  };

  // draw image + polygons
  useEffect(() => {
    if (!imgSrc || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0,0,800,600);
      ctx.drawImage(img, 0,0,800,600);
      // existing slots in green
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(76,175,80,0.8)';
      pointsList.forEach(slot => {
        ctx.beginPath();
        slot.points.forEach((p,i) => i===0?ctx.moveTo(...p):ctx.lineTo(...p));
        ctx.closePath(); ctx.stroke();
      });
      // current in red
      if (currentPts.length) {
        ctx.strokeStyle = 'rgba(244,67,54,0.8)';
        ctx.beginPath();
        currentPts.forEach((p,i) => i===0?ctx.moveTo(...p):ctx.lineTo(...p));
        ctx.stroke();
      }
    };
    img.src = imgSrc;
  }, [imgSrc, pointsList, currentPts]);

  return (
    <div className="json-gen-container">
      <h2>Slot JSON Generator</h2>
      <div className="controls">
        <input type="file" accept="image/*" onChange={onImage}/>
        {imgSrc && (
          <>
            <p>Click image to drop points for slot #{slotIdx}</p>
            <button onClick={completeSlot}>Complete Slot</button>
            <button onClick={downloadJSON} disabled={!pointsList.length}>Download JSON</button>
            <button onClick={() => navigate('/garage-layout')}>Back</button>
          </>
        )}
      </div>
      {imgSrc && (
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="slot-canvas"
          onClick={onClickCanvas}
        />
      )}
    </div>
  );
}
