import React, {useState} from 'react';
import styles from './PluginActivity.module.css';
import { MdCancel } from "react-icons/md";
import { IoCaretBackCircle } from "react-icons/io5";

const Popup = ({ plugins,backPopup }) => {
    const [popup , setPopup] = useState(true);


    const removePopup =() => {
       setPopup(false)
    }

  if (!popup) return null;
   
  return (
    <div className={styles.popup}> 
      <div className={styles.warning}>Plugin Details
        {popup && <IoCaretBackCircle className={styles.returnBack} onClick={backPopup} />} 
        {popup && <MdCancel className={styles.cancelIcon} onClick={removePopup}/>}
      </div>
      <p>Details for Plugin: {plugins.id}</p>
      <p>User: {plugins.userName}</p>
      <p>Current Status: <strong>online</strong></p>
      {/* Add more details as needed */}
    </div>
  );
};     


export default Popup;
