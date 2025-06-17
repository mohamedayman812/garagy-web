import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getDocs, getDoc, doc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import {
  FaMoneyCheckAlt, FaUser, FaCalendarAlt, FaClock, FaEnvelope, FaPhone
} from 'react-icons/fa';
import './payments.css';

const Payments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);

        // Step 1: Get admin garage ID
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        const adminData = adminSnap.data();
        const garageId = adminData?.garageId;
        if (!garageId) return;

        // Step 2: Fetch all reservations
        const reservationsSnap = await getDocs(collection(db, 'reservations'));
        const filtered = [];

        for (const docSnap of reservationsSnap.docs) {
          const res = docSnap.data();

          const resGarageId = res?.garageInfo?.garageId;
          const transactionStatus = res?.transaction?.status;

          if (resGarageId === garageId && transactionStatus === 'success') {
            const userId = res?.customerInfo?.customerId;
            let userData = {};

            if (userId) {
              const userSnap = await getDoc(doc(db, 'users', userId));
              userData = userSnap.exists() ? userSnap.data().personalInfo : {};
            }

            filtered.push({
              id: docSnap.id,
              amount: res.transaction.amount,
              method: res.transaction.paymentMethod,
              startTime: new Date(res.timingInfo.startTime),
              endTime: new Date(res.timingInfo.endTime),
              user: {
                name: userData?.name || 'Unknown',
                email: userData?.email || 'N/A',
                phone: userData?.phoneNumber || 'N/A'
              }
            });
          }
        }

        setPayments(filtered);
      } catch (error) {
        console.error('Error loading payments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [navigate]);

  if (isLoading) {
    return <div className="payments-container"><p>Loading payments...</p></div>;
  }

  return (
    <div className="payments-container">
      <h2><FaMoneyCheckAlt /> Payments</h2>

      {payments.length === 0 ? (
        <p>No successful payments found for your garage.</p>
      ) : (
        <div className="payments-list">
          {payments.map((p, i) => (
            <div className="payment-card" key={i}>
              <p><strong>Amount:</strong> ${p.amount}</p>
              <p><strong>Method:</strong> {p.method}</p>
              <p>
                <FaCalendarAlt className="icon" /> Start: {p.startTime.toLocaleString()}
              </p>
              <p>
                <FaClock className="icon" /> End: {p.endTime.toLocaleString()}
              </p>
              <hr />
              <p><FaUser className="icon" /> {p.user.name}</p>
              <p><FaEnvelope className="icon" /> {p.user.email}</p>
              <p><FaPhone className="icon" /> {p.user.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Payments;
