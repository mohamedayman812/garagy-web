"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth } from "firebase/auth"
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore"
import { db } from "../firebase"
import {
  FaChartLine,
  FaDollarSign,
  FaCalendarAlt,
  FaCreditCard,
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaSpinner,
} from "react-icons/fa"
import "./Statistics.css"

const Statistics = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalReservations: 0,
    successfulPayments: 0,
    averageAmount: 0,
    monthlyRevenue: [],
    paymentMethods: {},
    dailyStats: [],
    recentTransactions: [],
    growthRate: 0,
  })

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        navigate("/login")
        return
      }

      const adminDoc = await getDoc(doc(db, "admins", user.uid))
      if (!adminDoc.exists()) return
      const garageId = adminDoc.data().garageId

      const reservationsQuery = query(
        collection(db, "reservations"),
        where("garageInfo.garageId", "==", garageId)
      )
      const reservationsSnap = await getDocs(reservationsQuery)
      const reservations = []
      reservationsSnap.forEach((doc) => reservations.push({ id: doc.id, ...doc.data() }))

      const stats = calculateStatistics(reservations)
      setStatistics(stats)
    } catch (error) {
      console.error("Error fetching statistics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStatistics = (reservations) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let totalRevenue = 0
    let successfulPayments = 0
    const paymentMethods = {}
    const monthlyData = {}
    const dailyData = {}
    const recentTransactions = []

    reservations.forEach((reservation) => {
      const transaction = reservation.transaction
      const metadata = reservation.metadata
      const timingInfo = reservation.timingInfo

      if (transaction?.status === "success") {
        const amount = Number(transaction.amount) || 0
        totalRevenue += amount
        successfulPayments++

        const method = transaction.paymentMethod || "Unknown"
        paymentMethods[method] = (paymentMethods[method] || 0) + amount

        let createdDate
        if (metadata?.createdAt?.seconds) {
          createdDate = new Date(metadata.createdAt.seconds * 1000)
        } else if (typeof metadata?.createdAt === "string") {
          createdDate = new Date(metadata.createdAt)
        }

        if (createdDate && !isNaN(createdDate.getTime())) {
          const monthKey = `${createdDate.getFullYear()}-${createdDate.getMonth()}`
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount

          const dayKey = createdDate.toISOString().split("T")[0]
          dailyData[dayKey] = (dailyData[dayKey] || 0) + amount

          recentTransactions.push({
            id: reservation.id,
            amount,
            date: createdDate,
            method,
            duration: timingInfo?.duration || 0,
          })
        }
      }
    })

    recentTransactions.sort((a, b) => b.date - a.date)

    const monthlyRevenue = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      monthlyRevenue.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthlyData[key] || 0,
      })
    }

    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split("T")[0]
      dailyStats.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: dailyData[key] || 0,
        date: key,
      })
    }

    const currentMonthKey = `${currentYear}-${currentMonth}`
    const previousMonthKey = `${currentMonth === 0 ? currentYear - 1 : currentYear}-${
      currentMonth === 0 ? 11 : currentMonth - 1
    }`
    const currentMonthRevenue = monthlyData[currentMonthKey] || 0
    const previousMonthRevenue = monthlyData[previousMonthKey] || 0
    const growthRate =
      previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0

    return {
      totalRevenue,
      totalReservations: reservations.length,
      successfulPayments,
      averageAmount: successfulPayments > 0 ? totalRevenue / successfulPayments : 0,
      monthlyRevenue,
      paymentMethods,
      dailyStats,
      recentTransactions: recentTransactions.slice(0, 10),
      growthRate,
    }
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

  if (isLoading) {
    return (
      <div className="statistics-container">
        <div className="loading-card">
          <FaSpinner className="spinner-icon" />
          <h2>Loading Statistics...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h1 className="statistics-title">
          <FaChartLine className="title-icon" />
          Payment Statistics
        </h1>
        <p className="statistics-subtitle">
          Comprehensive analysis of your garage revenue and transactions
        </p>
      </div>

      {/* Metrics Cards Row */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon"><FaDollarSign /></div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <p className="metric-value">{formatCurrency(statistics.totalRevenue)}</p>
            <div className={`metric-change ${statistics.growthRate >= 0 ? "positive" : "negative"}`}>
              {statistics.growthRate >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(statistics.growthRate).toFixed(1)}% from last month
            </div>
          </div>
        </div>

        <div className="metric-card reservations">
          <div className="metric-icon"><FaCalendarAlt /></div>
          <div className="metric-content">
            <h3>Total Reservations</h3>
            <p className="metric-value">{statistics.totalReservations}</p>
          </div>
        </div>

        <div className="metric-card payments">
          <div className="metric-icon"><FaCreditCard /></div>
          <div className="metric-content">
            <h3>Successful Payments</h3>
            <p className="metric-value">{statistics.successfulPayments}</p>
            <div className="metric-subtitle">
              {statistics.totalReservations > 0
                ? `${((statistics.successfulPayments / statistics.totalReservations) * 100).toFixed(1)}% success rate`
                : "No data"}
            </div>
          </div>
        </div>

        <div className="metric-card average">
          <div className="metric-icon"><FaUsers /></div>
          <div className="metric-content">
            <h3>Average Amount</h3>
            <p className="metric-value">{formatCurrency(statistics.averageAmount)}</p>
            <div className="metric-subtitle">Per successful transaction</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3 className="chart-title">Monthly Revenue</h3>
          <div className="chart-container">
            <div className="bar-chart">
              {statistics.monthlyRevenue.map((m, i) => {
                const max = Math.max(...statistics.monthlyRevenue.map((v) => v.revenue))
                const height = max > 0 ? (m.revenue / max) * 100 : 0
                return (
                  <div key={i} className="bar-item">
                    <div className="bar" style={{ height: `${height}%` }} title={formatCurrency(m.revenue)}>
                      <span className="bar-value">{formatCurrency(m.revenue)}</span>
                    </div>
                    <span className="bar-label">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Last 7 Days</h3>
          <div className="chart-container">
            <div className="line-chart">
              {statistics.dailyStats.map((d, i) => {
                const max = Math.max(...statistics.dailyStats.map((v) => v.revenue))
                const height = max > 0 ? (d.revenue / max) * 100 : 0
                return (
                  <div key={i} className="line-item">
                    <div className="line-point" style={{ bottom: `${height}%` }} title={formatCurrency(d.revenue)}>
                      <span className="point-value">{formatCurrency(d.revenue)}</span>
                    </div>
                    <span className="line-label">{d.day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics
