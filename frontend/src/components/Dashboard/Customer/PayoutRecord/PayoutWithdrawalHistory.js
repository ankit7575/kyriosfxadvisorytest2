import React from 'react';

const PayoutWithdrawalHistory = () => {
  // Mock data for withdrawal history
  const demoHistoryData = {
    success: true,
    payoutData: {
      payouts: [
        {
          user: "67433cb25ec2bf0553a957e5",
          name: "Ankit",
          totalAmount: 100,
          withdrawnAmount: 30,
          balanceAmount: 70,
          status: "Pending",
          requestHistory: [
            { date: "2024-11-10", amount: 30, status: "Requested" },
            { date: "2024-11-12", amount: 10, status: "Approved" },
          ],
        },
      ],
    },
  };

  return (
    <div className="withdrawal-history-container">
      <h2>Withdrawal History</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {demoHistoryData.payoutData.payouts[0].requestHistory.map((entry, index) => (
            <tr key={index}>
              <td>{entry.date}</td>
              <td>{entry.amount}</td>
              <td>{entry.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayoutWithdrawalHistory;
