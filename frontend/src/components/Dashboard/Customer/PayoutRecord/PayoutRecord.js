import React, { useState, useEffect } from 'react';

// Combined mock data including payout and incentive data
const demoPayoutData = {
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
        incentives: {
          directReferral: [
            {
              date: "2024-11-24",
              directIncentive: 15,
              fortnightlyProfit: 100,
            },
            {
              date: "2024-11-25",
              directIncentive: 20,
              fortnightlyProfit: 120,
            }
          ],
          stage2Referral: [
            {
              date: "2024-11-24",
              directIncentive: 10,
              fortnightlyProfit: 80,
            }
          ]
        }
      },
      {
        user: "67433cb25ec2bf0553a57875",
        name: "Rohit",
        totalAmount: 150,
        withdrawnAmount: 50,
        balanceAmount: 100,
        status: "Pending",
        incentives: {
          directReferral: [
            {
              date: "2024-11-24",
              directIncentive: 15,
              fortnightlyProfit: 100,
            }
          ],
          stage2Referral: [
            {
              date: "2024-11-23",
              directIncentive: 10,
              fortnightlyProfit: 90,
            }
          ]
        }
      }
    ],
  },
};

const PayoutRecord = () => {
  const [payouts, setPayouts] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null); // Track the selected user for withdrawal

  // Simulate fetching payout data
  useEffect(() => {
    if (demoPayoutData.success) {
      setPayouts(demoPayoutData.payoutData.payouts);
    }
  }, []);

  // Handle withdrawal request submission
  const handleWithdrawRequest = (user, amount) => {
    if (amount <= 0 || amount > user.balanceAmount) {
      setError("Invalid withdrawal amount.");
      return;
    }

    // Update the selected user's balance and status
    const updatedPayouts = payouts.map((payout) =>
      payout.user === user.user
        ? {
            ...payout,
            withdrawnAmount: payout.withdrawnAmount + amount,
            balanceAmount: payout.balanceAmount - amount,
            status: "Requested", // Change status to Requested after withdrawal request
          }
        : payout
    );
    setPayouts(updatedPayouts);
    setWithdrawAmount(0); // Clear the input after submitting
    setError(null); // Clear any previous errors
  };

  return (
    <div className="payout-container">
      <h2 className="page-title">Payout Record & Withdrawal Request</h2>

      {/* Payout Records */}
      <div className="payout-records">
        <h3 className="section-title">Payout History</h3>
        <table className="payout-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Total Amount</th>
              <th>Withdrawn Amount</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((user, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.totalAmount + user.incentives.directReferral.reduce((sum, incentive) => sum + incentive.directIncentive, 0) + user.incentives.stage2Referral.reduce((sum, incentive) => sum + incentive.directIncentive, 0)}</td>
                <td>{user.withdrawnAmount}</td>
                <td>{user.balanceAmount}</td>
                <td>{user.status}</td>
                <td>
                  <button
                    className="withdraw-btn"
                    onClick={() => setSelectedUser(user)}
                  >
                    Request Withdrawal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdrawal Request Form (shown only when a user is selected) */}
      {selectedUser && (
        <div className="withdrawal-form">
          <h3 className="section-title">Request Withdrawal</h3>
          <p>
            Available balance for <strong>{selectedUser.name}</strong>:{" "}
            <span className="balance-amount">{selectedUser.balanceAmount}</span>
          </p>
          <div className="withdraw-input-container">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              placeholder="Enter amount to withdraw"
              className="withdraw-input"
              max={selectedUser.balanceAmount}
            />
            <button
              onClick={() => handleWithdrawRequest(selectedUser, withdrawAmount)}
              className="submit-withdraw-btn"
            >
              Submit Request
            </button>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default PayoutRecord;
