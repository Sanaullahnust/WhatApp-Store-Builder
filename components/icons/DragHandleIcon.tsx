
import React from 'react';

const DragHandleIcon: React.FC = () => (
  <svg className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
    <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
    <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
  </svg>
);

export default DragHandleIcon;
