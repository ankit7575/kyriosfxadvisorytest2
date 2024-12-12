import React, { useState, useEffect } from "react";
import './home.css';
import { Line } from 'react-chartjs-2';
// eslint-disable-next-line no-unused-vars
import Chart from 'chart.js/auto';

// Mock data (you might be fetching this from an API)
const demoData = {
  success: true,
  message: "Fortnightly profit data fetched successfully.",
  name: "Mohit",
  email: "ankitvashist764@gmail.com",
  status: "active",
  referral: {
    directReferral: [
      {
        name: "Ankit",
        history: [
          {
            fortnightlyProfitIncentive: [
              { date: { "$date": "2024-11-24T14:48:49.514Z" }, fortnightlyProfit: 100, directIncentive: 15 },
            ],
          },
          {
            fortnightlyProfitIncentive: [
              { date: { "$date": "2024-11-24T14:52:53.243Z" }, fortnightlyProfit: 100, directIncentive: 15 },
            ],
          },
        ],
      },
    ],
  },
};

const Section1 = () => {
  const [fortnightlyProfitData, setFortnightlyProfitData] = useState([]);
  const [recentReferrals, setRecentReferrals] = useState([]);

  // Fetching data on component mount
  useEffect(() => {
    if (demoData.success && demoData.referral && demoData.referral.directReferral) {
      const allProfitData = demoData.referral.directReferral.flatMap(referral =>
        referral.history.flatMap(historyItem => historyItem.fortnightlyProfitIncentive)
      );
      setFortnightlyProfitData(allProfitData);
      const recentReferralData = demoData.referral.directReferral.flatMap(referral =>
        referral.history.slice(0, 2).map(historyItem => historyItem.fortnightlyProfitIncentive)
      );
      setRecentReferrals(recentReferralData.flat());
    }
  }, []);

  // Calculate total profit
  const totalProfit = fortnightlyProfitData.reduce((total, data) => total + (data.fortnightlyProfit || 0), 0);

  // Chart data for fortnightly profit
  const chartData = {
    labels: fortnightlyProfitData.map(item => new Date(item.date.$date).toLocaleDateString()),
    datasets: [
      {
        label: 'Fortnightly Profit',
        data: fortnightlyProfitData.map(item => item.fortnightlyProfit),
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };

  // Recently Referral Incentives table data
  const referralColumns = ["Date", "Fortnightly Profit", "Direct Incentive"];
  const referralRows = recentReferrals.map(item => ({
    date: new Date(item.date.$date).toLocaleDateString(),
    profit: item.fortnightlyProfit,
    incentive: item.directIncentive,
  }));

  return (
    <div className="customer-dashboard">
      <h1 className="dashboard-title">Welcome, {demoData.name || "User"}</h1>

      {/* User profile details */}
      <div className="profitbox">
        <div className="row">
          <div className="col-lg-4">
            <div className="Fortnightlyprofit">
              <div className="status">
                <strong>Fortnightly Profit: </strong> {totalProfit}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="accountstatus">
              <div className="status">
                <strong>Account Status: </strong> {demoData.status}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="referralteam">
              <div className="team-count">
                <strong>Referral Team Size: </strong> {demoData.referral.directReferral.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart for fortnightly profit */}
      <div className="row">
        <div className="col-lg-12">
          <div className="chart-container">
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} height={200} />
          </div>
        </div>

        {/* Recently Referral Incentives Table */}
        <div className="col-lg-6">
          <div className="table-container">
            <h3>Recently Referral Incentives</h3>
            <table className="table">
              <thead>
                <tr>
                  {referralColumns.map((col, idx) => (
                    <th key={idx}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referralRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.date}</td>
                    <td>{row.profit}</td>
                    <td>{row.incentive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Team Referral Table */}
        <div className="col-lg-6">
          <div className="table-container">
            <h3>Recently Team Referral</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Team Size</th>
                  <th>Referral Date</th>
                </tr>
              </thead>
              <tbody>
                {demoData.referral.directReferral.map((referral, idx) => (
                  <tr key={idx}>
                    <td>{referral.name}</td>
                    <td>{referral.history.length}</td>
                    <td>
                      {new Date(referral.history[0]?.fortnightlyProfitIncentive[0]?.date.$date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Section1;
