import { View, TextInput, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-gray-700 font-medium mb-1 ml-1">{label}</Text>}
      <TextInput
        className={`bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-gray-900`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>}
    </View>
  );
}
