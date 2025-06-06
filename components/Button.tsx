import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  textClassName?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  className = '',
  textClassName = '',
  ...props
}) => {
  return (
    <TouchableOpacity
      className={`px-6 py-3 rounded-button items-center justify-center ${className}`}
      {...props}
    >
      <Text className={`font-semibold text-base ${textClassName}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
