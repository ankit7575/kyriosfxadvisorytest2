import React, { useState } from 'react';

const PayoutWithdrawalRequest = () => {
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [error, setError] = useState(null);
  const [payouts, setPayouts] = useState([
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
  ]);

  const handleWithdrawRequest = (user, amount) => {
    if (amount <= 0 || amount > user.balanceAmount) {
      setError("Invalid withdrawal amount.");
      return;
    }

    // Update the payouts array with the new withdrawal request
    const updatedPayouts = payouts.map((payout) =>
      payout.user === user.user
        ? {
            ...payout,
            withdrawnAmount: payout.withdrawnAmount + amount,
            balanceAmount: payout.balanceAmount - amount,
            status: "Requested",
            requestHistory: [
              ...payout.requestHistory,
              { date: new Date().toLocaleDateString(), amount, status: "Requested" },
            ],
          }
        : payout
    );

    // Set the updated payouts in state
    setPayouts(updatedPayouts);
    setWithdrawAmount(0);
    setError(null);
  };

  return (
    <div className="withdrawal-request-container">
      <h2>Request Withdrawal</h2>
      <input
        type="number"
        value={withdrawAmount}
        onChange={(e) => setWithdrawAmount(Number(e.target.value))}
        placeholder="Enter amount to withdraw"
        min="1"
        max={payouts[0]?.balanceAmount || 0} // Ensuring the amount can't exceed the balance
      />
      <button onClick={() => handleWithdrawRequest(payouts[0], withdrawAmount)}>
        Submit Request
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default PayoutWithdrawalRequest;
