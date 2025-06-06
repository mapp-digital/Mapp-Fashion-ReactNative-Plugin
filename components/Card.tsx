import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <View 
      className={`rounded-card p-card bg-white shadow-card ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
