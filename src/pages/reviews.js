import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import './reviews.css';

// Chart.js
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGarageReviews = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        const garageId = adminDoc.exists() ? adminDoc.data().garageId : null;
        if (!garageId) return;

        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('garageInfo.garageId', '==', garageId)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);

        const reviewsData = await Promise.all(
          reviewsSnapshot.docs.map(async (docSnap) => {
            const review = docSnap.data();
            const customerId = review.customerInfo?.customerId;
            const customerName = review.customerInfo?.customerName || 'Unknown';

            let userData = {
              name: customerName,
              phone: 'N/A',
              email: 'N/A',
              carPlate: 'N/A',
              initials: customerName.charAt(0).toUpperCase() || 'U',
            };

            if (customerId) {
              const userRef = doc(db, 'users', customerId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const data = userSnap.data();
                const personal = data.personalInfo || {};
                userData.name = personal.name || customerName;
                userData.phone = personal.phoneNumber || 'N/A';
                userData.email = personal.email || 'N/A';
                userData.initials = userData.name.charAt(0).toUpperCase() || 'U';

                const vehiclesRef = collection(db, 'users', customerId, 'vehicles');
                const vehiclesSnap = await getDocs(vehiclesRef);
                if (!vehiclesSnap.empty) {
                  const vehicleData = vehiclesSnap.docs[0].data();
                  userData.carPlate = vehicleData.licensePlate || 'N/A';
                }
              }
            }

            return {
              id: docSnap.id,
              description: review.reviewInfo?.description || '',
              rating: review.reviewInfo?.rating || 0,
              user: userData,
            };
          })
        );

        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGarageReviews();
  }, []);

  // Chart preparation
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach(review => {
    const r = Math.round(review.rating);
    if (r >= 1 && r <= 5) {
      ratingCounts[r - 1]++;
    }
  });

  const chartData = {
    labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
    datasets: [
      {
        label: 'Number of Reviews',
        data: ratingCounts,
        backgroundColor: '#4caf50',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, stepSize: 1 },
      },
    },
  };

  if (loading) {
    return (
      <div className="reviews-container">
        <h3>Loading reviews...</h3>
      </div>
    );
  }

  return (
    <div className="reviews-container">
      <h2>User Reviews</h2>

      {/* Chart Display */}
      <div style={{ width: '100%', maxWidth: '600px', marginBottom: '40px' }}>
        <h3 style={{ color: 'white', textAlign: 'center' }}>Rating Distribution</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>

      {reviews.length === 0 ? (
        <p>No reviews available.</p>
      ) : (
        <div className="reviews-grid">
          {reviews.map((review, index) => (
            <div key={index} className="review-card">
              <strong>{review.user.name}</strong>
              <p>{review.user.email}</p>
              <p>📞 {review.user.phone}</p>
              <p>License Plate: {review.user.carPlate}</p>
              <p>"{review.description}"</p>
              <small>⭐ Rating: {review.rating} / 5</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
