
import React from 'react'
import styles from './LogoutPopup.module.css';
import { useNavigate } from 'react-router-dom'
import { Logout } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const LogoutPopup = ({ onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2>Logging out</h2>
        <p>Do you want to log out?</p>
        <div className={styles.buttons}>
          <button className={styles.noButton} onClick={onClose}>
            NO
          </button>
          <button className={styles.yesButton} onClick={handleLogout}>
            YES
          </button>
        </div>
      </div>
    </div>
  );
};
  

export default LogoutPopup