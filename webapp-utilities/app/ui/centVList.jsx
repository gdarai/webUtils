import React from 'react';

export const CentVList = ({ children }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '20px',
    gap: '20px',
  }}>
    {children}
  </div>
);

export default CentVList;
