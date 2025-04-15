import React from 'react';

export const CentHList = ({ style = {}, children }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '20px',
    ...style,
  }}>
    {children}
  </div>
);

export default CentHList;
