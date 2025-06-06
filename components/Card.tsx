import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-white shadow-card border border-neutral-100';
      case 'outlined':
        return 'bg-white border-2 border-neutral-200';
      default:
        return 'bg-white shadow-card';
    }
  };

  return (
    <View 
      className={`rounded-card p-card ${getVariantStyles()} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
