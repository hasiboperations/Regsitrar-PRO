import React from 'react';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div 
      className="fixed bottom-5 right-5 bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center z-[100] animate-slide-in-up"
      role="alert"
    >
      <CheckCircleIcon className="w-6 h-6 mr-3" />
      <span className="font-semibold">{message}</span>
    </div>
  );
};

export default Toast;
