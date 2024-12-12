import React, { useState } from "react";
import { Link } from 'react-router-dom';
import './Navigation.css'; // Import CSS for styling
import logo from '../assets/img/logo.png';

// Dropdown Component
function Dropdown({ title, links, isOpen, onToggle }) {
  return (
    <li className="Polaris-Navigation__ListItem">
      <div className="Polaris-Navigation__ItemWrapper" onClick={onToggle}>
        <div className={`Polaris-Navigation__ItemInnerWrapper ${isOpen ? 'Polaris-Navigation__ItemInnerWrapper--selected' : ''}`}>
          <Link
            data-polaris-unstyled="true"
            className={`Polaris-Navigation__Item ${isOpen ? 'Polaris-Navigation--subNavigationActive' : ''}`}
            to="#"
            aria-expanded={isOpen}
            aria-controls="sub-menu"
          >
            <div className="Polaris-Navigation__Icon">
              <span className="Polaris-Icon">
                <ui-icon type="order" tone="unstable-inherit"></ui-icon>
              </span>
            </div>
            <span className="Polaris-Navigation__Text">
              <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text--semibold">{title}</span>
              <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span> {/* Move arrow to the end */}
            </span>
          </Link>
        </div>
      </div>
      {isOpen && (
        <div className="Polaris-Navigation__SecondaryNavigation Polaris-Navigation__SecondaryNavigationOpen">
          <ul className="Polaris-Navigation__List" id="sub-menu">
            {links.map(({ path, label }, index) => (
              <li className="Polaris-Navigation__ListItem" key={index}>
                <Link
                  data-polaris-unstyled="true"
                  className="Polaris-Navigation__Item"
                  to={path}
                >
                  <span className="Polaris-Navigation__Text">
                    <span className="Polaris-Text--root Polaris-Text--bodyMd Polaris-Text--regular Polaris-Text--subdued">{label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

// AdminNavigation Component
function AdminNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const dropdownLinks = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/all-team-referral", label: "All Team Referral" },
    { path: "/admin/all-fortnightly-profit", label: "All Fortnightly Profit" },
    { path: "/admin/all-referral-incentives", label: "All Referral Incentives" },
    { path: "/admin/all-trade-authentication", label: "All Trade Authentication" },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="menu-toggle" onClick={toggleMobileMenu}>
          <span className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </div>
        <ul className={`menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <li>
            <img src={logo} alt="Company Logo" className="logo" />
          </li>
          <li>
            <Link to="/admin/dashboard">Admin Dashboard</Link>
          </li>
          {/* Dropdown Menu */}
          <Dropdown
            title="Admin Sections"
            links={dropdownLinks}
            isOpen={isDropdownOpen}
            onToggle={toggleDropdown}
          />
          <li>
            <Link to="/admin/profile">Payout Records</Link>
          </li>
          <li>
            <Link to="/admin/support-requests">All Support Requests</Link>
          </li>
          <li>
            <Link to="/admin/profile">My Profile</Link>
          </li>
          <li>
            <Link to="/Logout">Logout</Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default AdminNavigation;
