import { Image, StyleSheet } from 'react-native';
import { IMAGES } from '../assets/images';

interface PaperLogoProps {
  id: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PaperLogo({ name, size = 'md' }: PaperLogoProps) {
  let src = IMAGES.timesOfIndia;

  if (name.toLowerCase().includes('vijayavani')) src = IMAGES.vijayavani;
  else if (name.toLowerCase().includes('prajavani')) src = IMAGES.prajavani;
  else if (name.toLowerCase().includes('hindu')) src = IMAGES.theHindu;

  const dims =
    size === 'lg'
      ? { width: 200, height: 70 }
      : size === 'sm'
      ? { width: 80, height: 36 }
      : { width: 120, height: 48 };

  return (
    <Image
      source={src}
      style={[styles.img, dims]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  img: {
    borderRadius: 0,
  },
});
