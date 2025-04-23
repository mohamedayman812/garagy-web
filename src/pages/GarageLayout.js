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
        sectionSlots: [1] // Array to store slots for each section
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
                        if (garageData.layout && garageData.layout.sections) {
                            const sections = garageData.layout.sections || [];
                            setLayout(sections);
                            
                            // Initialize sectionSlots array with slot counts for each section
                            const sectionSlots = sections.map(section => section.slots.length);
                            
                            setLayoutConfig({
                                sectionCount: sections.length,
                                sectionSlots
                            });
                            setMode('edit');
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching garage data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGarageData();
    }, [navigate]);

    const handleSectionCountChange = (e) => {
        const sectionCount = Math.max(1, parseInt(e.target.value) || 1);
        
        // Update sectionSlots array to match new section count
        const newSectionSlots = [...layoutConfig.sectionSlots];
        if (sectionCount > newSectionSlots.length) {
            // Add new sections with default 1 slot
            while (newSectionSlots.length < sectionCount) {
                newSectionSlots.push(1);
            }
        } else {
            // Remove extra sections
            newSectionSlots.length = sectionCount;
        }
        
        setLayoutConfig({
            sectionCount,
            sectionSlots: newSectionSlots
        });
    };

    const handleSlotCountChange = (index, value) => {
        const newSectionSlots = [...layoutConfig.sectionSlots];
        newSectionSlots[index] = Math.max(1, parseInt(value) || 1);
        setLayoutConfig(prev => ({
            ...prev,
            sectionSlots: newSectionSlots
        }));
    };

    const generateLayout = () => {
        const newLayout = layoutConfig.sectionSlots.map((slotsCount, index) => {
            const slots = [];
            for (let j = 0; j < slotsCount; j++) {
                slots.push({
                    id: `${index+1}-${j+1}`,
                    status: 'available'
                });
            }
            return {
                id: index + 1,
                name: `Section ${index + 1}`,
                slots
            };
        });

        setLayout(newLayout);
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
        } catch (error) {
            console.error('Error saving layout:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSlotStatus = (sectionId, slotId) => {
        setLayout(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    slots: section.slots.map(slot => {
                        if (slot.id === slotId) {
                            return {
                                ...slot,
                                status: slot.status === 'available' ? 'unavailable' : 'available'
                            };
                        }
                        return slot;
                    })
                };
            }
            return section;
        }));
    };

    if (isLoading) {
        return (
            <div className="garage-layout-container">
                <div className="loading-message">Loading garage layout...</div>
            </div>
        );
    }

    const hasLayout = Array.isArray(layout) && layout.length > 0;

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
                                name="sectionCount"
                                min="1"
                                max="20"
                                value={layoutConfig.sectionCount}
                                onChange={handleSectionCountChange}
                            />
                        </div>
                    </div>

                    <div className="section-slots-config">
                        <h4>Slots per Section:</h4>
                        {layoutConfig.sectionSlots.map((slots, index) => (
                            <div key={index} className="input-group">
                                <label>Section {index + 1} Slots:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={slots}
                                    onChange={(e) => handleSlotCountChange(index, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={generateLayout}
                        className="action-button"
                    >
                        Generate Layout
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setMode('create')}
                    className="action-button"
                >
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
                                    {section.slots.map(slot => (
                                        <div
                                            key={slot.id}
                                            className={`slot ${slot.status}`}
                                            onClick={() => toggleSlotStatus(section.id, slot.id)}
                                        >
                                            <span>Slot {slot.id.split('-')[1]}</span>
                                            <div className="status-indicator"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {mode === 'create' && (
                        <button 
                            onClick={saveLayout}
                            className="save-button"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Layout'}
                        </button>
                    )}
                </div>
            )}

            <button 
                onClick={() => navigate('/home')}
                className="back-button"
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default GarageLayout;