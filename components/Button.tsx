import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  disabled = false,
  className = ''
}: ButtonProps) {
  
  const baseStyle = "rounded-xl flex-row justify-center items-center";
  
  const variantStyles = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    outline: "border-2 border-primary bg-transparent",
    ghost: "bg-transparent",
  };

  const textStyles = {
    primary: "text-white font-semibold",
    secondary: "text-white font-semibold",
    outline: "text-primary font-semibold",
    ghost: "text-primary font-semibold",
  };

  const sizeStyles = {
    sm: "py-2 px-4",
    md: "py-3 px-6",
    lg: "py-4 px-8",
  };

  return (
    <TouchableOpacity 
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#2563EB' : '#FFFFFF'} />
      ) : (
        <Text className={`${textStyles[variant]} text-lg`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
