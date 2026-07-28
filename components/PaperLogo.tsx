import { View, Image, StyleSheet, Text } from 'react-native';
import { ImageIcon } from 'lucide-react-native';
import { resolvePaperImage, IMAGES } from '../assets/images';
import { store } from '../utils/store';

type PaperLogoProps = {
  id?: string;
  name?: string;
  imageSrc?: string | null;
  size?: 'sm' | 'md' | 'lg' | number;
  rounded?: number;
  backgroundColor?: string;
};

/**
 * Universal paper logo component.
 *
 * Priority:
 *   1) explicit `imageSrc` prop (a file:// URI / bundled asset key / empty '')
 *   2) lookup in store by `id`, then fall back to `name` → catalog key
 *   3) render empty-state "NO LOGO" placeholder — NEVER auto-assume a default
 */
export default function PaperLogo({
  id,
  name,
  imageSrc,
  size = 'md',
  rounded = 10,
  backgroundColor,
}: PaperLogoProps) {
  let resolvedSrc: string | null = imageSrc ?? null;

  if (!resolvedSrc && id) {
    const fromStore = store.getPapers().find((p) => p.id === id);
    if (fromStore) resolvedSrc = fromStore.imageSrc ?? null;
  }
  if (!resolvedSrc && name) {
    const fromStore2 = store.getPapers().find((p) => p.name === name);
    if (fromStore2) resolvedSrc = fromStore2.imageSrc ?? null;
  }

  const dims =
    typeof size === 'number'
      ? { width: size, height: size }
      : size === 'lg'
      ? { width: 160, height: 160 }
      : size === 'sm'
      ? { width: 60, height: 60 }
      : { width: 100, height: 100 };

  const resolved = resolvedSrc ? resolvePaperImage(resolvedSrc) : null;
  let legacySrc: any = null;
  if (!resolved && name) {
    const lc = name.toLowerCase();
    if (lc.includes('vijayavani')) legacySrc = IMAGES['vijayavani.webp'];
    else if (lc.includes('prajavani')) legacySrc = IMAGES['prajavani.webp'];
    else if (lc.includes('hindu')) legacySrc = IMAGES['hindu.webp'];
    else if (lc.includes('times')) legacySrc = IMAGES['timesofindia.webp'];
  }

  const finalSource = resolved ?? legacySrc;
  const smallestDim = Math.min(dims.width, dims.height);
  const hasImage = !!finalSource;

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: dims.width,
          height: dims.height,
          borderRadius: rounded,
          backgroundColor: hasImage ? (backgroundColor ?? '#FFFFFF') : '#FEF2F2',
          borderWidth: hasImage ? 1 : 2,
          borderColor: hasImage ? '#E2E8F0' : '#EF4444',
          borderStyle: hasImage ? 'solid' : 'dashed',
        },
      ]}
    >
      {hasImage ? (
        <Image
          source={finalSource}
          style={[styles.img, { width: '100%', height: '100%', borderRadius: rounded }]}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.emptyState}>
          <ImageIcon size={Math.max(12, smallestDim * 0.4)} color="#EF4444" />
          <Text style={[styles.emptyText, { fontSize: Math.max(8, smallestDim * 0.22) }]}>
            NO LOGO
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 0,
  },
  img: {},
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  emptyText: {
    color: '#EF4444',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
