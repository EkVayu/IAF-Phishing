import React from 'react';

const DateFormatter = ({ dateString }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    hours = hours.toString().padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  return <span>{formatDate(dateString)}</span>;
};

export default DateFormatter;
