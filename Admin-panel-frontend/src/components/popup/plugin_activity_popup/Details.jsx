import React, {useState} from 'react';
import styles from './Details.module.css';
import { MdCancel } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { IoCaretBackCircle } from "react-icons/io5";


const Details = ({ plugins,backPopup,pluginActivity }) => {
    const [showPopup, setShowPopup] = useState(true);
    const navigate = useNavigate();

    const handlePopup = () =>{
        setShowPopup(false);
    }

    const handleViewMoreClick = () => {
      handlePopup();
      navigate('/plugin');
    };

  if (!showPopup) return null;
  return (
    <div className={styles.details}>
      <h3>Plugin Details</h3>
      {showPopup && <IoCaretBackCircle className={styles.backPopup} onClick={backPopup} />}
      {showPopup && <MdCancel className={styles.closePopup} onClick={handlePopup}/>}
      <table>
        <thead>
          <tr>
            <th>Plugin ID</th>
            <th>User Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {plugins.slice(0,5).map((plugin, index) => (
            <tr key={index}>
              <td>{plugin.id}</td>
              <td>{plugin.userName}</td>
              <td>
                <button className={styles.getDetailsButton} onClick={pluginActivity}>Get Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {plugins.length > 5 && (
        <button className={styles.viewMoreButton} onClick={handleViewMoreClick}>
        View More
    </button>
      )}
    </div>
  );
};

export default Details;
