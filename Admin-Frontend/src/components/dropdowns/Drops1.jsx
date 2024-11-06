import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const Dropdown = ({ trigger, children }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  const toggleDropdown = () => {
    setOpen(!open);
  };

  useEffect(() => {
    const handler = (event) => {
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="dropdown-container">
      <div className="menu-trigger" onClick={toggleDropdown}>
        {trigger}
      </div>

      <div className={`dropdown-menu ${open ? 'active' : 'inactive'}`} ref={menuRef}>
        <ul>
          {children}
        </ul>
      </div>
    </div>
  );
};

Dropdown.propTypes = {
  trigger: PropTypes.element.isRequired,
  children: PropTypes.node.isRequired
};

export default Dropdown;
