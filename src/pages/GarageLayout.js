import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import './GarageLayout.css';

const GarageLayout = () => {
  const navigate = useNavigate();
  const [garageId, setGarageId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState('create');
  const [layoutConfig, setLayoutConfig] = useState({
    sectionCount: 1,
    sectionSlots: [1]
  });
  const [layout, setLayout] = useState([]);

  useEffect(() => {
    const fetchGarageData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          navigate('/login');
          return;
        }

        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          const garageId = adminDoc.data().garageId;
          setGarageId(garageId);

          const garageDoc = await getDoc(doc(db, 'garages', garageId));
          if (garageDoc.exists()) {
            const garageData = garageDoc.data();
            if (garageData.layout?.sections?.length > 0) {
              const sections = garageData.layout.sections;
              setLayout(sections);
              setLayoutConfig({
                sectionCount: sections.length,
                sectionSlots: sections.map(s => s.slots.length)
              });
              setMode('edit');
            }
          }
        }
      } catch (err) {
        console.error('Error loading garage layout:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGarageData();
  }, [navigate]);

  const getSectionLetter = (index) => {
    return String.fromCharCode(65 + index); // 65 = 'A'
  };

  const generateUUID = () => {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `slot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  const handleSectionCountChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value) || 1);
    const newSlots = [...layoutConfig.sectionSlots];

    while (newSlots.length < count) newSlots.push(1);
    while (newSlots.length > count) newSlots.pop();

    setLayoutConfig({
      sectionCount: count,
      sectionSlots: newSlots
    });
  };

  const handleSlotCountChange = (index, value) => {
    const slots = [...layoutConfig.sectionSlots];
    slots[index] = Math.max(1, parseInt(value) || 1);
    setLayoutConfig(prev => ({ ...prev, sectionSlots: slots }));
  };

  const generateLayout = () => {
    const newLayout = layoutConfig.sectionSlots.map((slotsCount, sectionIndex) => {
      const sectionLetter = getSectionLetter(sectionIndex);
      const slots = Array.from({ length: slotsCount }, () => ({
        id: generateUUID(),
        status: 'available'
      }));

      return {
        id: sectionLetter,
        name: `Section ${sectionLetter}`,
        slots
      };
    });

    setLayout(newLayout);
  };

  const saveLayout = async () => {
    if (!garageId) return;

    setIsLoading(true);
    try {
      const layoutData = {
        layout: {
          sections: layout,
          sectionCount: layout.length,
          lastUpdated: new Date()
        }
      };

      await updateDoc(doc(db, 'garages', garageId), layoutData);
      setMode('edit');
    } catch (err) {
      console.error('Failed to save layout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSlotStatus = (sectionId, slotId) => {
    setLayout(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              slots: section.slots.map(slot =>
                slot.id === slotId
                  ? {
                      ...slot,
                      status: slot.status === 'available' ? 'unavailable' : 'available'
                    }
                  : slot
              )
            }
          : section
      )
    );
  };

  if (isLoading) {
    return (
      <div className="garage-layout-container">
        <div className="loading-message">Loading garage layout...</div>
      </div>
    );
  }

  const hasLayout = layout.length > 0;

  return (
    <div className="garage-layout-container">
      <h2>Garage Layout</h2>

      {mode === 'create' ? (
        <div className="layout-configuration">
          <h3>Layout Configuration</h3>
          <div className="config-inputs">
            <div className="input-group">
              <label>Number of Sections:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={layoutConfig.sectionCount}
                onChange={handleSectionCountChange}
              />
            </div>
          </div>

          <div className="section-slots-config">
            <h4>Slots per Section:</h4>
            {layoutConfig.sectionSlots.map((count, index) => (
              <div key={index} className="input-group">
                <label>Section {getSectionLetter(index)} Slots:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={e => handleSlotCountChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button className="action-button" onClick={generateLayout}>
            Generate Layout
          </button>
        </div>
      ) : (
        <button className="action-button" onClick={() => setMode('create')}>
          Create New Layout
        </button>
      )}

      {hasLayout && (
        <div className="layout-preview">
          <h3>{mode === 'create' ? 'Preview' : 'Current Layout'}</h3>
          <div className="sections-container">
            {layout.map(section => (
              <div key={section.id} className="section">
                <h4>{section.name} ({section.slots.length} slots)</h4>
                <div className="slots-grid">
                  {section.slots.map((slot, index) => (
                    <div
                      key={slot.id}
                      className={`slot ${slot.status}`}
                      onClick={() => toggleSlotStatus(section.id, slot.id)}
                    >
                      <span>Slot {index + 1}</span>
                      <div className="status-indicator"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {mode === 'create' && (
            <button
              className="save-button"
              onClick={saveLayout}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Layout'}
            </button>
          )}
        </div>
      )}

      <button className="back-button" onClick={() => navigate('/home')}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default GarageLayout;
