// components/Dashboard/Customer/CustomerDashboard.js
import React from "react"; // Import React
import PayoutWithdrawalRequest from "../../../components/Dashboard/Customer/PayoutRecord/PayoutWithdrawalRequest"; // Adjust the path as needed
import Layout from "../../../components/Layout/Layout"; // Adjust the path if necessary

const PayoutWithdrawalRequestPage = () => {
  return (
    <Layout> {/* Pass userRole to Layout */}
      <PayoutWithdrawalRequest /> {/* First instance of CustomerHome */}
    </Layout>
  );
};

export default PayoutWithdrawalRequestPage;
