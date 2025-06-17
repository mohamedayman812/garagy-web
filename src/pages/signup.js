import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser, FaEnvelope, FaLock, FaWarehouse, FaMapMarkerAlt,
  FaInfoCircle, FaDollarSign, FaImage, FaCheck
} from "react-icons/fa";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "firebase/auth";
import {
  doc,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import "./signup.css";

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    garageName: "", garageLocation: "", description: "",
    hourlyrate: "", lat: "", lng: "",
    photoUrls: [""]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const updatePhotoUrl = (index, value) => {
    const updated = [...form.photoUrls];
    updated[index] = value;
    updateField("photoUrls", updated);
  };

  const addPhotoUrlField = () => {
    updateField("photoUrls", [...form.photoUrls, ""]);
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const auth = getAuth();
      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const photoObj = {};
      form.photoUrls.forEach((url, i) => {
        if (url.trim()) {
          photoObj[`picUrl${i + 1}`] = url.trim();
        }
      });

      await setDoc(doc(db, "admins", user.uid), {
        name: form.name,
        email: form.email,
        garageId: user.uid,
        type: "admin",
        createdAt: new Date()
      });

      await setDoc(doc(db, "garages", user.uid), {
        Information: {
          name: form.garageName,
          description: form.description,
          hourlyrate: Number(form.hourlyrate),
          pictures: photoObj
        },
        Location: {
          Address: form.garageLocation,
          Lat: form.lat,
          Lng: form.lng
        },
        adminId: user.uid,
        createdAt: new Date()
      });

      navigate("/login");
    } catch (err) {
      console.error("Signup failed:", err);
      setError("Signup failed. Please check all inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-card" onSubmit={handleSubmit}>
        <h2>Register Your Garage</h2>

        <div className="steps-indicator">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`step ${step === i ? "active" : ""}`}>
              {step > i ? <FaCheck /> : i}
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="input-group"><FaUser /><input placeholder="Full Name" value={form.name} onChange={e => updateField("name", e.target.value)} required /></div>
            <div className="input-group"><FaEnvelope /><input placeholder="Email" type="email" value={form.email} onChange={e => updateField("email", e.target.value)} required /></div>
            <div className="input-group"><FaLock /><input placeholder="Password" type="password" value={form.password} onChange={e => updateField("password", e.target.value)} required /></div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="input-group"><FaWarehouse /><input placeholder="Garage Name" value={form.garageName} onChange={e => updateField("garageName", e.target.value)} required /></div>
            <div className="input-group"><FaMapMarkerAlt /><input placeholder="Garage Address" value={form.garageLocation} onChange={e => updateField("garageLocation", e.target.value)} required /></div>
            <div className="input-group"><FaInfoCircle /><input placeholder="Description" value={form.description} onChange={e => updateField("description", e.target.value)} required /></div>
            <div className="input-group"><FaDollarSign /><input placeholder="Hourly Rate" type="number" value={form.hourlyrate} onChange={e => updateField("hourlyrate", e.target.value)} required /></div>
            <div className="input-group"><FaMapMarkerAlt /><input placeholder="Latitude" value={form.lat} onChange={e => updateField("lat", e.target.value)} required /></div>
            <div className="input-group"><FaMapMarkerAlt /><input placeholder="Longitude" value={form.lng} onChange={e => updateField("lng", e.target.value)} required /></div>
          </>
        )}

        {step === 3 && (
          <>
            <h4>Add Photo URLs:</h4>
            {form.photoUrls.map((url, idx) => (
              <div className="input-group" key={idx}>
                <FaImage />
                <input
                  placeholder={`Photo URL ${idx + 1}`}
                  value={url}
                  onChange={(e) => updatePhotoUrl(idx, e.target.value)}
                />
              </div>
            ))}
            <button type="button" onClick={addPhotoUrlField} className="add-btn">
              + Add Another Photo URL
            </button>
          </>
        )}

        {step === 4 && (
          <div className="review">
            <h4>Review Details:</h4>
            <p><strong>Admin:</strong> {form.name} ({form.email})</p>
            <p><strong>Garage:</strong> {form.garageName} - {form.garageLocation}</p>
            <p><strong>Description:</strong> {form.description}</p>
            <p><strong>Rate:</strong> ${form.hourlyrate}</p>
            <p><strong>Lat/Lng:</strong> {form.lat}, {form.lng}</p>
            <p><strong>Photos:</strong> {form.photoUrls.length}</p>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div className="buttons">
          {step > 1 && <button type="button" onClick={prevStep}>Back</button>}
          {step < 4 && <button type="button" onClick={nextStep}>Next</button>}
          {step === 4 && <button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </button>}
        </div>
      </form>
    </div>
  );
};

export default SignUp;
