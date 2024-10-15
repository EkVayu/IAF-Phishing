// CombinedPopup.jsx
import React, { useState } from 'react';
import Details from './Details';
import Popup from './Popup';
import PluginActivity from './PluginActivity';
import styles from './PluginPopupController.module.css';

const PluginPopup = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const plugins = [
    { id: 'Plugin 1', userName: 'User 1' },
    { id: 'Plugin 2', userName: 'User 2' },
    { id: 'Plugin 3', userName: 'User 3' },
    { id: 'Plugin 4', userName: 'User 4' },
    { id: 'Plugin 5', userName: 'User 5' },
    { id: 'Plugin 6', userName: 'User 6' },
    // Add more plugins as needed
  ];

  const handleViewDetails = () => {
    setShowDetails(true);
    setShowPopup(false);
    setShowActivity(false);
  };

  const handleBackPopup = () => {
    if(showDetails){
      setShowDetails(false);
      setShowPopup(true);
    }
    if(showActivity){
      setShowDetails(true);
      setShowActivity(false);
      setShowPopup(false);
    }
  };

  const handlePluginActivity = () => {
    setShowDetails(false);
    setShowPopup(false);
    setShowActivity(true);
  };

  return (
    <div className={styles.pluginPopup}>
      {showPopup && <Popup onViewDetails={handleViewDetails} />}
      {showDetails && <Details plugins={plugins} backPopup={handleBackPopup} pluginActivity={handlePluginActivity} />}
      {showActivity && <PluginActivity plugins={plugins} backPopup={handleBackPopup} />}
    </div>
  );
};

export default PluginPopup;
