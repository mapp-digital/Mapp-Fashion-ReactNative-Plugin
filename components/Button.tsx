import React from 'react';
import { Pressable, PressableProps, Text } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary-500 active:bg-secondary-600';
      case 'outline':
        return 'bg-transparent border-2 border-primary-500 active:bg-primary-50';
      case 'ghost':
        return 'bg-transparent active:bg-neutral-100';
      default:
        return 'bg-primary-500 active:bg-primary-600';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'outline':
        return 'text-primary-500';
      case 'ghost':
        return 'text-neutral-700';
      default:
        return 'text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2';
      case 'lg':
        return 'px-8 py-4';
      default:
        return 'px-6 py-3';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const disabledStyles = disabled ? 'opacity-50' : '';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <Pressable
      className={`
        rounded-button
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${widthStyles}
        ${disabledStyles}
        items-center justify-center
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      <Text className={`font-semibold ${getTextStyles()} ${getTextSize()}`}>
        {title}
      </Text>
    </Pressable>
  );
};
