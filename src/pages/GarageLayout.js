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
        slotsPerSection: 1
    });
    const [layout, setLayout] = useState([]); // Initialize as empty array

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
                        // Safely check for layout data
                        if (garageData.layout && garageData.layout.sections) {
                            setLayout(garageData.layout.sections || []);
                            setLayoutConfig({
                                sectionCount: garageData.layout.sectionCount || 1,
                                slotsPerSection: garageData.layout.slotsPerSection || 1
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

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setLayoutConfig(prev => ({
            ...prev,
            [name]: Math.max(1, parseInt(value) || 1)
        }));
    };

    const generateLayout = () => {
        const { sectionCount, slotsPerSection } = layoutConfig;
        const newLayout = [];

        for (let i = 0; i < sectionCount; i++) {
            const slots = [];
            for (let j = 0; j < slotsPerSection; j++) {
                slots.push({
                    id: `${i+1}-${j+1}`,
                    status: 'available'
                });
            }
            newLayout.push({
                id: i+1,
                name: `Section ${i+1}`,
                slots
            });
        }

        setLayout(newLayout);
    };

    const saveLayout = async () => {
        if (!garageId) return;
        
        setIsLoading(true);
        try {
            await updateDoc(doc(db, 'garages', garageId), {
                layout: {
                    sections: layout,
                    sectionCount: layoutConfig.sectionCount,
                    slotsPerSection: layoutConfig.slotsPerSection,
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

    // Safely check if layout exists and has sections
    const hasLayout = Array.isArray(layout) && layout.length > 0;

    return (
        <div className="garage-layout-container">
            <h2>Garage Layout</h2>
            
            {mode === 'create' ? (
                <div className="layout-configuration">
                    <h3> Layout settings</h3>
                    <div className="config-inputs">
                        <div className="input-group">
                            <label>Number of Sections:</label>
                            <input
                                type="number"
                                name="sectionCount"
                                min="1"
                                max="20"
                                value={layoutConfig.sectionCount}
                                onChange={handleConfigChange}
                            />
                        </div>
                        <div className="input-group">
                            <label>Slots per Section:</label>
                            <input
                                type="number"
                                name="slotsPerSection"
                                min="1"
                                max="50"
                                value={layoutConfig.slotsPerSection}
                                onChange={handleConfigChange}
                            />
                        </div>
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
                                <h4>{section.name}</h4>
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
                    <button 
                        onClick={saveLayout}
                        className="save-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Layout'}
                    </button>
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