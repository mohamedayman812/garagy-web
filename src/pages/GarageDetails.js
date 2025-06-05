import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
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
  const [imageUrls, setImageUrls] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    // Get garage name from state or localStorage
    const garageNameFromState = location.state?.garageName;
    if (garageNameFromState) {
      setFormData((prev) => ({
        ...prev,
        name: garageNameFromState,
      }));
      localStorage.setItem("tempGarageName", garageNameFromState);
    } else {
      const storedGarageName = localStorage.getItem("tempGarageName");
      if (storedGarageName) {
        setFormData((prev) => ({
          ...prev,
          name: storedGarageName,
        }));
      } else {
        navigate("/signup");
      }
    }
  }, [navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    if (
      !formData.description ||
      !formData.hourlyrate ||
      !formData.address ||
      !formData.lat ||
      !formData.lng ||
      !formData.name
    ) {
      setError("Please fill in all fields");
      return;
    }

    // Filter out empty URLs and validate remaining ones
    const validUrls = imageUrls.filter((url) => url.trim() !== "");
    if (validUrls.length === 0) {
      setError("Please add at least one image URL");
      return;
    }

    // Validate all URLs
    const invalidUrls = validUrls.filter((url) => !validateImageUrl(url));
    if (invalidUrls.length > 0) {
      setError("Please enter valid image URLs");
      return;
    }

    setIsLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      // Create the initial layout structure
      const initialLayout = {
        Sections: {
          "Section A": {
            ID: "331",
            Spots: {
              A1: {
                ID: "441",
                Reserved: false,
              },
            },
          },
        },
      };

      // Create pictures object with numbered keys
      const picturesObject = validUrls.reduce((acc, url, index) => {
        acc[`picUrl${index + 1}`] = url;
        return acc;
      }, {});

      // Update garage document with the complete structure
      const garageRef = doc(db, "garages", user.uid);
      await updateDoc(garageRef, {
        description: formData.description,
        hourlyrate: parseFloat(formData.hourlyrate),
        name: formData.name,
        pictures: picturesObject,
        Layout: initialLayout,
        Location: {
          Address: formData.address,
          Lat: parseFloat(formData.lat),
          Lng: parseFloat(formData.lng),
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
        <h2 className="garage-details-title">{formData.name}</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder=" "
            />
            <label>Description</label>
          </div>

          <div className="form-group">
            <input
              type="number"
              name="hourlyrate"
              value={formData.hourlyrate}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              placeholder=" "
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
              placeholder=" "
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
                step="any"
                required
                placeholder=" "
              />
              <label>Latitude</label>
            </div>

            <div className="form-group">
              <input
                type="number"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                step="any"
                required
                placeholder=" "
              />
              <label>Longitude</label>
            </div>
          </div>

          <div className="image-urls-container">
            <label className="image-urls-label">
              Image URLs (1-4 images required)
            </label>
            {imageUrls.map((url, index) => (
              <div key={index} className="image-url-input-group">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="Enter image URL"
                  className="image-url-input"
                  required
                />
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="remove-url-button"
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
                <FaPlus /> Add Another Image URL
              </button>
            )}
          </div>

          {imageUrls.some((url) => url.trim() !== "") && (
            <div className="pictures-grid">
              {imageUrls.map(
                (url, index) =>
                  url.trim() !== "" && (
                    <div key={index} className="picture-container">
                      <img
                        src={url}
                        alt={`Garage ${index + 1}`}
                        className="garage-picture"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/150?text=Invalid+Image";
                        }}
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
