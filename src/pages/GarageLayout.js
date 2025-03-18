import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Import Firestore
import './Login.css'; // Reuse the same CSS for consistent styling

const GarageLayout = () => {
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [numSections, setNumSections] = useState(0);
    const [slotsPerSection, setSlotsPerSection] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch the garage layout from Firestore
    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const layoutDoc = await getDoc(doc(db, 'garage', 'layout'));
                if (layoutDoc.exists()) {
                    console.log('Layout data:', layoutDoc.data());
                    setSections(layoutDoc.data().sections);
                } else {
                    console.log('No layout found.');
                }
            } catch (error) {
                console.error('Error fetching layout:', error);
            }
        };
        fetchLayout();
    }, []);

    // Save the garage layout to Firestore
    const saveLayout = async () => {
        try {
            const newSections = Array.from({ length: numSections }, (_, i) => ({
                sectionId: i + 1,
                slots: Array.from({ length: slotsPerSection }, (_, j) => ({
                    slotId: j + 1,
                    status: 'available', // Default status
                })),
            }));

            await setDoc(doc(db, 'garage', 'layout'), { sections: newSections });
            console.log('Layout saved successfully.');
            setSections(newSections);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving layout:', error);
        }
    };

    // Update the garage layout in Firestore
    const updateLayout = async () => {
        try {
            const newSections = Array.from({ length: numSections }, (_, i) => ({
                sectionId: i + 1,
                slots: Array.from({ length: slotsPerSection }, (_, j) => ({
                    slotId: j + 1,
                    status: 'available', // Default status
                })),
            }));

            await setDoc(doc(db, 'garage', 'layout'), { sections: newSections });
            console.log('Layout updated successfully.');
            setSections(newSections);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating layout:', error);
        }
    };

    // Toggle slot status (available/unavailable)
    const toggleSlotStatus = (sectionId, slotId) => {
        const updatedSections = sections.map((section) => {
            if (section.sectionId === sectionId) {
                return {
                    ...section,
                    slots: section.slots.map((slot) => {
                        if (slot.slotId === slotId) {
                            return {
                                ...slot,
                                status: slot.status === 'available' ? 'unavailable' : 'available',
                            };
                        }
                        return slot;
                    }),
                };
            }
            return section;
        });
        setSections(updatedSections);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Garage Layout</h2>

                {sections.length === 0 || isEditing ? (
                    // If no layout exists or editing is enabled, allow the admin to create/update one
                    <div className="layout-form">
                        <h3>{sections.length === 0 ? 'Create Garage Layout' : 'Update Garage Layout'}</h3>
                        <div className="form-group">
                            <label htmlFor="numSections">Number of Sections</label>
                            <input
                                type="number"
                                id="numSections"
                                value={numSections}
                                onChange={(e) => setNumSections(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="slotsPerSection">Slots per Section</label>
                            <input
                                type="number"
                                id="slotsPerSection"
                                value={slotsPerSection}
                                onChange={(e) => setSlotsPerSection(Number(e.target.value))}
                                required
                            />
                        </div>
                        <button onClick={sections.length === 0 ? saveLayout : updateLayout} className="login-button">
                            {sections.length === 0 ? 'Save Layout' : 'Update Layout'}
                        </button>
                    </div>
                ) : (
                    // If layout exists, display it
                    <div className="layout-display">
                        <h3>Current Layout</h3>
                        {sections.map((section) => (
                            <div key={section.sectionId} className="section">
                                <h4>Section {section.sectionId}</h4>
                                <div className="slots">
                                    {section.slots.map((slot) => (
                                        <div
                                            key={slot.slotId}
                                            className={`slot ${slot.status}`}
                                            onClick={() => toggleSlotStatus(section.sectionId, slot.slotId)}
                                        >
                                            <p>Slot {slot.slotId}: {slot.status}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setIsEditing(true)} className="login-button">
                            Update Layout
                        </button>
                    </div>
                )}

                {/* Back to Dashboard Button */}
                <button onClick={() => navigate('/home')} className="login-button" style={{ marginTop: '20px' }}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default GarageLayout;