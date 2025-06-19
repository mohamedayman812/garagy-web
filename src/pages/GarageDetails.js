import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaPlus, FaTimes } from "react-icons/fa";
import "./GarageDetails.css";

const GarageDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    description: "",
    hourlyrate: "",
    name: "",
    address: "",
    lat: "",
    lng: "",
  });
  const [imageUrls, setImageUrls] = useState([""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchGarageData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      const garageRef = doc(db, "garages", user.uid);
      const garageSnap = await getDoc(garageRef);

      if (garageSnap.exists()) {
        const garageData = garageSnap.data();
        if (garageData.description && garageData.Layout) {
          // Setup already done, redirect to home
          navigate("/home");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          name: garageData.name || "",
          description: garageData.description || "",
          hourlyrate: garageData.hourlyrate || "",
          address: garageData.Location?.Address || "",
          lat: garageData.Location?.Lat || "",
          lng: garageData.Location?.Lng || "",
        }));

        const existingPics = garageData.pictures
          ? Object.values(garageData.pictures)
          : [""];
        setImageUrls(existingPics);
      } else {
        const garageName = location.state?.garageName || localStorage.getItem("tempGarageName");
        if (!garageName) {
          navigate("/signup");
        } else {
          setFormData((prev) => ({ ...prev, name: garageName }));
        }
      }
    };

    fetchGarageData();
  }, [navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const addImageUrl = () => {
    if (imageUrls.length < 4) {
      setImageUrls([...imageUrls, ""]);
    }
  };

  const removeImageUrl = (index) => {
    if (imageUrls.length > 1) {
      const newUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newUrls);
    }
  };

  const validateImageUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { description, hourlyrate, address, lat, lng, name } = formData;
    if (!description || !hourlyrate || !address || !lat || !lng || !name) {
      setError("Please fill in all fields");
      return;
    }

    const validUrls = imageUrls.filter((url) => url.trim() !== "");
    const invalidUrls = validUrls.filter((url) => !validateImageUrl(url));
    if (invalidUrls.length > 0) {
      setError("Please enter valid image URLs");
      return;
    }

    setIsLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      const picturesObject = validUrls.reduce((acc, url, index) => {
        acc[`picUrl${index + 1}`] = url;
        return acc;
      }, {});

      const initialLayout = {
        Sections: {
          "Section A": {
            ID: "SEC-" + Math.random().toString(36).substring(2, 6),
            Spots: {
              A1: {
                ID: "SP-" + Math.random().toString(36).substring(2, 6),
                Reserved: false,
              },
            },
          },
        },
      };

      const garageRef = doc(db, "garages", user.uid);
      await updateDoc(garageRef, {
        description,
        hourlyrate: parseFloat(hourlyrate),
        name,
        pictures: picturesObject,
        Layout: initialLayout,
        Location: {
          Address: address,
          Lat: parseFloat(lat),
          Lng: parseFloat(lng),
        },
      });

      navigate("/home");
    } catch (err) {
      console.error("Error updating garage details:", err);
      setError("Failed to update garage details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="garage-details-container">
      <div className="garage-details-card">
        <h2 className="garage-details-title">{formData.name || "Garage Setup"}</h2>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Enter garage description"
            />
            <label>Description</label>
          </div>

          <div className="form-group">
            <input
              type="number"
              name="hourlyrate"
              value={formData.hourlyrate}
              onChange={handleChange}
              required
              step="0.5"
              placeholder="Hourly Rate"
            />
            <label>Hourly Rate ($)</label>
          </div>

          <div className="form-group">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Garage Address"
            />
            <label>Address</label>
          </div>

          <div className="coordinates-container">
            <div className="form-group">
              <input
                type="number"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                required
                step="any"
                placeholder="Latitude"
              />
              <label>Latitude</label>
            </div>
            <div className="form-group">
              <input
                type="number"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                required
                step="any"
                placeholder="Longitude"
              />
              <label>Longitude</label>
            </div>
          </div>

          <div className="image-urls-container">
            <label className="image-urls-label">Garage Images (1-4)</label>
            {imageUrls.map((url, index) => (
              <div className="image-url-input-group" key={index}>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  className="image-url-input"
                  placeholder="Enter image URL"
                  required
                />
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    className="remove-url-button"
                    onClick={() => removeImageUrl(index)}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
            {imageUrls.length < 4 && (
              <button
                type="button"
                onClick={addImageUrl}
                className="add-url-button"
              >
                <FaPlus /> Add Another Image
              </button>
            )}
          </div>

          {imageUrls.some((url) => url.trim()) && (
            <div className="pictures-grid">
              {imageUrls.map(
                (url, index) =>
                  url && (
                    <div key={index} className="picture-container">
                      <img
                        src={url}
                        alt={`Garage ${index + 1}`}
                        className="garage-picture"
                        onError={(e) =>
                          (e.target.src =
                            "https://via.placeholder.com/150?text=Invalid+Image")
                        }
                      />
                    </div>
                  )
              )}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GarageDetails;
