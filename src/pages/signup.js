import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./login.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    garageName: "",
    garageLocation: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.garageName ||
      !formData.garageLocation
    ) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create user account
      console.log("Creating user account...");
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      console.log("User created:", user.uid);

      // Create admin document
      console.log("Creating admin subdocument...");
      await setDoc(doc(db, "admins", user.uid), {
        name: formData.name,
        email: formData.email,
        type: "admin",
        garageId: user.uid,
        createdAt: new Date(),
      });

      // Create garage document
      await setDoc(doc(db, "garages", user.uid), {
        name: formData.garageName,
        location: formData.garageLocation,
        adminId: user.uid,
        createdAt: new Date(),
      });

      // Navigate to garage details page with garage name
      navigate("/garage-details", {
        state: { garageName: formData.garageName },
      });
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err.code === "auth/email-already-in-use"
          ? "Email already in use"
          : err.code === "auth/invalid-email"
          ? "Invalid email address"
          : err.code === "auth/weak-password"
          ? "Password should be at least 6 characters"
          : "Failed to create account"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Admin Sign Up</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSignUp}>
          {["name", "email", "password", "garageName", "garageLocation"].map(
            (field) => (
              <div className="form-group" key={field}>
                <input
                  type={
                    field === "password"
                      ? "password"
                      : field === "email"
                      ? "email"
                      : "text"
                  }
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                  placeholder=" "
                />
                <label htmlFor={field}>
                  {field === "garageName"
                    ? "Garage Name"
                    : field === "garageLocation"
                    ? "Garage Location"
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
              </div>
            )
          )}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        <p className="text-center mt-3">
          Already have an account?{" "}
          <a href="/login" className="text-white">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
