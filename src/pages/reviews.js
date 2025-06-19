import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  collectionGroup,
  query,
} from 'firebase/firestore';
import { db } from '../firebase';
import './reviews.css';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviewsWithUserData = async () => {
      try {
        const reviewsSnapshot = await getDocs(collection(db, 'reviews'));

        const reviewsData = await Promise.all(
          reviewsSnapshot.docs.map(async (docSnap) => {
            const review = docSnap.data();
            const customerId = review.customerInfo?.customerId;

            let userData = {
              name: 'Unknown',
              phone: 'N/A',
              email: 'N/A',
              carPlate: 'N/A',
              initials: 'U',
            };

            if (customerId) {
              const userRef = doc(db, 'users', customerId);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const data = userSnap.data();
                const personal = data.personalInfo || {};

                userData.name = personal.name || 'Unnamed';
                userData.phone = personal.phoneNumber || 'N/A';
                userData.email = personal.email || 'N/A';
                userData.initials = userData.name.charAt(0).toUpperCase() || 'U';

                // Fetch vehicle license plate (first one found)
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

    fetchReviewsWithUserData();
  }, []);

  if (loading) {
    return (
      <div className="reviews-container">
        <h3>Loading reviews...</h3>
      </div>
    );
  }

  return (
    <div className="reviews-container">
      <h2 className="reviews-title">User Reviews</h2>
      {reviews.length === 0 ? (
        <p className="no-reviews">No reviews available.</p>
      ) : (
        reviews.map((review, index) => (
          <div key={index} className="review-card">
            <div className="user-header">
              <div className="user-avatar">{review.user.initials}</div>
              <div className="user-info">
                <h4>{review.user.name}</h4>
                <p>{review.user.email}</p>
                <p> 📞 {review.user.phone}</p>
                <p>Licence Plate: {review.user.carPlate}</p>
              </div>
            </div>
            <div className="review-body">
              <p className="review-description">"{review.description}"</p>
              <p className="review-rating">⭐ Rating: {review.rating} / 5</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Reviews;
