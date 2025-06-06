import React from 'react';
import { Text, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'overline';
  color?: 'primary' | 'secondary' | 'neutral' | 'error' | 'success' | 'warning';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'neutral',
  weight,
  className = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'h1':
        return 'text-4xl font-bold';
      case 'h2':
        return 'text-3xl font-bold';
      case 'h3':
        return 'text-2xl font-semibold';
      case 'h4':
        return 'text-xl font-semibold';
      case 'caption':
        return 'text-sm';
      case 'overline':
        return 'text-xs font-medium uppercase tracking-wide';
      default:
        return 'text-base';
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case 'primary':
        return 'text-primary-600';
      case 'secondary':
        return 'text-secondary-600';
      case 'error':
        return 'text-error-600';
      case 'success':
        return 'text-success-600';
      case 'warning':
        return 'text-warning-600';
      default:
        return 'text-neutral-800';
    }
  };

  const getWeightStyles = () => {
    if (!weight) return '';
    
    switch (weight) {
      case 'light':
        return 'font-light';
      case 'normal':
        return 'font-normal';
      case 'medium':
        return 'font-medium';
      case 'semibold':
        return 'font-semibold';
      case 'bold':
        return 'font-bold';
      default:
        return '';
    }
  };

  return (
    <Text
      className={`
        ${getVariantStyles()}
        ${getColorStyles()}
        ${getWeightStyles()}
        ${className}
      `}
      {...props}
    >
      {children}
    </Text>
  );
};

// Convenience components
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const Heading4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);
