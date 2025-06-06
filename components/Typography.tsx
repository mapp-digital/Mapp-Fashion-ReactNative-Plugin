import React from 'react';
import { Text, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <Text className={`text-base text-neutral-800 ${className}`} {...props}>
      {children}
    </Text>
  );
};

// Convenience components with preset styles
export const Heading1: React.FC<TypographyProps> = ({ className = '', ...props }) => (
  <Typography className={`text-4xl font-bold ${className}`} {...props} />
);

export const Heading2: React.FC<TypographyProps> = ({ className = '', ...props }) => (
  <Typography className={`text-3xl font-bold ${className}`} {...props} />
);

export const Heading3: React.FC<TypographyProps> = ({ className = '', ...props }) => (
  <Typography className={`text-2xl font-semibold ${className}`} {...props} />
);

export const Heading4: React.FC<TypographyProps> = ({ className = '', ...props }) => (
  <Typography className={`text-xl font-semibold ${className}`} {...props} />
);

export const Body: React.FC<TypographyProps> = ({ className = '', ...props }) => (
  <Typography className={`text-base ${className}`} {...props} />
);

export const Caption: React.FC<TypographyProps> = ({ className = '', ...props }) => (
  <Typography className={`text-sm ${className}`} {...props} />
);
