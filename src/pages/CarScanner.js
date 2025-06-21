import React, { useState } from "react"
import axios from "axios"
import "./CarScanner.css" // Optional for styling

const CarScanner = () => {
  const [image, setImage] = useState(null)
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setResult("")
      setError("")
    }
  }

  const handleSubmit = async () => {
    if (!image) return
    setLoading(true)
    setResult("")
    setError("")

    try {
      const formData = new FormData()
      formData.append("image", image)

      const response = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setResult((response.data?.message || "No result returned.").split("").reverse().join(""))

    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to scan the car image.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="car-scanner-container">
      <h2>Scan Car Image</h2>

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {image && (
        <div className="preview">
          <img src={URL.createObjectURL(image)} alt="Preview" height="150" />
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading || !image}>
        {loading ? "Processing..." : "Scan Image"}
      </button>

      {result && <div className="result-box">🔍 Result: <strong>{result}</strong></div>}
      {error && <div className="error-box">❌ {error}</div>}
    </div>
  )
}

export default CarScanner
