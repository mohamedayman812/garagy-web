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
  const [layoutConfig, setLayoutConfig] = useState({ sectionCount: 1, sectionSlots: [1] });
  const [layout, setLayout] = useState([]);
  const [popupSlot, setPopupSlot] = useState(null);
  const [popupUserId, setPopupUserId] = useState('');
  const [popupUserInfo, setPopupUserInfo] = useState('');

  useEffect(() => {
    const fetchGarageData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return navigate('/login');

        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          const garageId = adminDoc.data().garageId;
          setGarageId(garageId);
          const garageDoc = await getDoc(doc(db, 'garages', garageId));
          if (garageDoc.exists()) {
            const data = garageDoc.data();
            if (data.layout?.sections?.length > 0) {
              setLayout(data.layout.sections);
              setLayoutConfig({
                sectionCount: data.layout.sectionCount,
                sectionSlots: data.layout.sections.map(s => s.slots.length)
              });
              setMode('edit');
            }
          }
        }
      } catch (err) {
        console.error('Error loading layout:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGarageData();
  }, [navigate]);

  const getSectionLetter = (index) => String.fromCharCode(65 + index);

  const generateUUID = () =>
    crypto.randomUUID?.() || `slot_${Date.now()}_${Math.random().toFixed(5)}`;

  const handleSectionCountChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value) || 1);
    const updated = [...layoutConfig.sectionSlots];
    while (updated.length < count) updated.push(1);
    while (updated.length > count) updated.pop();
    setLayoutConfig({ sectionCount: count, sectionSlots: updated });
  };

  const handleSlotCountChange = (i, val) => {
    const slots = [...layoutConfig.sectionSlots];
    slots[i] = Math.max(1, parseInt(val) || 1);
    setLayoutConfig(prev => ({ ...prev, sectionSlots: slots }));
  };

  const generateLayout = () => {
    const layout = layoutConfig.sectionSlots.map((count, i) => ({
      id: getSectionLetter(i),
      name: `Section ${getSectionLetter(i)}`,
      slots: Array.from({ length: count }, () => ({
        id: generateUUID(),
        status: 'available',
        reservedBy: ''
      }))
    }));

    layout.push({
      id: 'E',
      name: 'Emergency Section',
      emergency: true,
      slots: Array.from({ length: 5 }, () => ({
        id: generateUUID(),
        status: 'available',
        reservedBy: ''
      }))
    });

    setLayout(layout);
  };

  const saveLayout = async () => {
    if (!garageId) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'garages', garageId), {
        layout: {
          sections: layout,
          sectionCount: layout.length,
          lastUpdated: new Date()
        }
      });
      setMode('edit');
    } catch (err) {
      console.error('Failed to save layout:', err);
    } finally {
      setIsLoading(false);
    }
  };

const toggleSlotStatus = async (sectionId, slotId) => {
  const section = layout.find(sec => sec.id === sectionId);
  const slot = section?.slots.find(s => s.id === slotId);
  if (!slot) return;

  let userInfo = '';
  let userId = slot.reservedBy || '';

  if ((slot.status === 'unavailable' || slot.status === 'reserved') && userId.trim() !== '') {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const name = userData.personalInfo?.name || 'N/A';
        const email = userData.personalInfo?.email || 'N/A';
        const phone = userData.personalInfo?.phoneNumber || 'N/A';

        userInfo = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`;
      } else {
        userInfo = 'User not found in database.';
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      userInfo = 'Error fetching user.';
    }
  }

  setPopupSlot({ sectionId, slotId, ...slot });
  setPopupUserId(userId);
  setPopupUserInfo(userInfo);
};


  const updateSlot = () => {
    setLayout(prev =>
      prev.map(section =>
        section.id === popupSlot.sectionId
          ? {
              ...section,
              slots: section.slots.map(slot =>
                slot.id === popupSlot.slotId
                  ? { ...slot, status: 'reserved', reservedBy: popupUserId }
                  : slot
              )
            }
          : section
      )
    );
    closePopup();
  };

  const closePopup = () => {
    setPopupSlot(null);
    setPopupUserId('');
    setPopupUserInfo('');
  };

  const navigateToCVLayout = () => navigate('/generate-cv-layout');

  if (isLoading)
    return (
      <div className="garage-layout-container">
        <div className="loading-message">Loading layout...</div>
      </div>
    );

  return (
    <div className="garage-layout-container">
      <h2>Garage Layout</h2>

      {mode === 'create' ? (
        <>
          <div className="layout-configuration">
            <h3>Layout Configuration</h3>
            <div className="config-inputs">
              <div className="input-group">
                <label>Number of Sections:</label>
                <input
                  type="number"
                  min="1"
                  value={layoutConfig.sectionCount}
                  onChange={handleSectionCountChange}
                />
              </div>
            </div>

            <div className="section-slots-config">
              <h4>Slots per Section:</h4>
              {layoutConfig.sectionSlots.map((count, i) => (
                <div key={i} className="input-group">
                  <label>Section {getSectionLetter(i)} Slots:</label>
                  <input
                    type="number"
                    min="1"
                    value={count}
                    onChange={e => handleSlotCountChange(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button className="action-button" onClick={generateLayout}>
              Generate Layout
            </button>
          </div>
        </>
      ) : (
        <button className="action-button" onClick={() => setMode('create')}>
          Create New Layout
        </button>
      )}

      {layout.length > 0 && (
        <div className="layout-preview">
          <h3>{mode === 'create' ? 'Preview' : 'Current Layout'}</h3>
          <div className="sections-container">
            {layout.map(section => (
              <div
                key={section.id}
                className={`section ${section.emergency ? 'emergency' : ''}`}
              >
                <h4>
                  {section.name} ({section.slots.length} slots)
                </h4>
                <div className="slots-grid">
                  {section.slots.map((slot, i) => (
                    <div
                      key={slot.id}
                      className={`slot ${slot.status}`}
                      onClick={() => toggleSlotStatus(section.id, slot.id)}
                    >
                      <span>Slot {i + 1}</span>
                      <div className="status-indicator" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {mode === 'create' && (
            <button className="save-button" onClick={saveLayout} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Layout'}
            </button>
          )}
        </div>
      )}

      <div className="footer-buttons">
        <button className="back-button" onClick={() => navigate('/home')}>
          Back to Dashboard
        </button>
        <button className="cv-layout-button" onClick={navigateToCVLayout}>
          Generate Auto Layout
        </button>
      </div>

      {popupSlot && (
        <div className="slot-info-popup">
          <h4>Slot Info</h4>
          <p>
            <strong>Status:</strong> {popupSlot.status}
          </p>

          {popupSlot.status === 'unavailable' || popupSlot.status === 'reserved' ? (
            <p style={{ whiteSpace: 'pre-line' }}>{popupUserInfo}</p>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter user ID"
                value={popupUserId}
                onChange={e => setPopupUserId(e.target.value)}
              />
              <button onClick={updateSlot}>Reserve Manually</button>
            </>
          )}
          <button onClick={closePopup}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default GarageLayout;
