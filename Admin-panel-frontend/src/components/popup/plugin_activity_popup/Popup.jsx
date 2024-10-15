import React, {useState} from 'react';
import styles from './Popup.module.css';
import { MdCancel } from "react-icons/md";

const Popup = ({ onViewDetails }) => {
    const [popup , setPopup] = useState(true);


    const removePopup =() => {
       setPopup(false)
    }

  if (!popup) return null;
   
  return (
    <div className={styles.popup}>
        
      <div className={styles.warning}>Plugin Disabled
        {popup && <MdCancel className={styles.cancelIcon} onClick={removePopup}/>}
      </div>
      <p>In Last <strong>15 Minutes</strong><br /> total <strong>10 Plugins</strong> are Disabled.</p>
      <button className={styles.viewButton} onClick={onViewDetails}>View</button>
    </div>
  );
};       

export default Popup;
