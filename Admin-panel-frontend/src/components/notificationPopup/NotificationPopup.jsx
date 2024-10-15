import React from 'react';
import styles from './NotificationPopup.module.css';
import { MdCancel } from "react-icons/md";

const NotificationPopup = ({ notifications, onClose }) => {
  return (
    <div className={styles.popup}>
      <div className={styles.header}>
        Notifications
        <MdCancel className={styles.closeIcon} onClick={onClose} />
      </div>
      <div className={styles.content}>
        {notifications.length === 0 ? (
          <p>No new notifications</p>
        ) : (
          <ul>
            {notifications.map((notification, index) => (
              <li key={index} className={styles.notificationItem}>
                {notification}
              </li> 
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationPopup;
