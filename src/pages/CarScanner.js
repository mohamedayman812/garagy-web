import React, { useState } from "react";
import axios from "axios";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "./CarScanner.css";

const CarScanner = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const initialState = {
    image: null,
    result: "",
    editedResult: "",
    loading: false,
    successMsg: "",
    error: "",
  };

  const [entrance, setEntrance] = useState({ ...initialState });
  const [exit, setExit] = useState({ ...initialState });

  const handleImageChange = (e, gate) => {
    const file = e.target.files[0];
    if (file) {
      const update = {
        image: file,
        result: "",
        editedResult: "",
        successMsg: "",
        error: "",
      };
      gate === "entrance" ? setEntrance((prev) => ({ ...prev, ...update })) : setExit((prev) => ({ ...prev, ...update }));
    }
  };

  const handleSubmit = async (gate) => {
    const state = gate === "entrance" ? entrance : exit;
    if (!state.image) return;

    const updateState = (updates) =>
      gate === "entrance"
        ? setEntrance((prev) => ({ ...prev, ...updates }))
        : setExit((prev) => ({ ...prev, ...updates }));

    updateState({ loading: true, error: "", result: "", successMsg: "" });

    try {
      const formData = new FormData();
      formData.append("image", state.image);

      const response = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const modelResult = response.data?.message || "No result returned.";
      const reversed = modelResult.split("").reverse().join("");
      updateState({ result: reversed, editedResult: reversed });
    } catch (err) {
      console.error("Upload error:", err);
      updateState({ error: "❌ Failed to scan the car image." });
    } finally {
      updateState({ loading: false });
    }
  };

  const handleSave = async (gate) => {
    const state = gate === "entrance" ? entrance : exit;
    if (!state.editedResult.trim()) {
      gate === "entrance"
        ? setEntrance((prev) => ({ ...prev, error: "Plate cannot be empty." }))
        : setExit((prev) => ({ ...prev, error: "Plate cannot be empty." }));
      return;
    }

    if (!user) {
      gate === "entrance"
        ? setEntrance((prev) => ({ ...prev, error: "User not authenticated." }))
        : setExit((prev) => ({ ...prev, error: "User not authenticated." }));
      return;
    }

    try {
      await addDoc(collection(db, `gates/${gate}/scans`), {
        plate: state.editedResult.trim(),
        scannedBy: user.uid,
        timestamp: new Date(),
      });

      const success = "✅ Plate saved to " + gate + " gate!";
      gate === "entrance"
        ? setEntrance({ ...initialState, successMsg: success })
        : setExit({ ...initialState, successMsg: success });
    } catch (err) {
      console.error("Firestore error:", err);
      gate === "entrance"
        ? setEntrance((prev) => ({ ...prev, error: "❌ Failed to save." }))
        : setExit((prev) => ({ ...prev, error: "❌ Failed to save." }));
    }
  };

  const renderSection = (gateLabel, state, gateType) => (
    <div className="scanner-section">
      <h3>{gateLabel}</h3>
      <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, gateType)} />
      {state.image && (
        <div className="preview">
          <img src={URL.createObjectURL(state.image)} alt="Preview" height="150" />
        </div>
      )}
      <button onClick={() => handleSubmit(gateType)} disabled={state.loading || !state.image}>
        {state.loading ? "Processing..." : "Scan Image"}
      </button>
      {state.result && (
        <div className="result-box">
          <label>Edit Plate:</label>
          <input
            type="text"
            value={state.editedResult}
            onChange={(e) =>
              gateType === "entrance"
                ? setEntrance((prev) => ({ ...prev, editedResult: e.target.value }))
                : setExit((prev) => ({ ...prev, editedResult: e.target.value }))
            }
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          />
          <br />
          <button
            style={{
              marginTop: "1rem",
              background: "#007bff",
              padding: "10px 20px",
              color: "white",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => handleSave(gateType)}
          >
            Save Plate
          </button>
        </div>
      )}
      {state.successMsg && <div className="success-box">{state.successMsg}</div>}
      {state.error && <div className="error-box">{state.error}</div>}
    </div>
  );

  return (
    <div className="car-scanner-container">
      <h2>Gate Scanner</h2>
      <div className="scanner-grid">
        {renderSection(" Entrance Gate", entrance, "entrance")}
        {renderSection(" Exit Gate", exit, "exit")}
      </div>
    </div>
  );
};

export default CarScanner;
