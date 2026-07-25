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
      ? { width: 200, height: 70 }
      : size === 'sm'
      ? { width: 80, height: 36 }
      : { width: 120, height: 48 };

  const resolved = resolvedSrc ? resolvePaperImage(resolvedSrc) : null;
  // Legacy IMAGES map fallback for the four well-known catalog names ONLY
  // (kept for backwards compatibility with callers that only pass `name`).
  // We still treat `resolved` as authoritative.
  let legacySrc: any = null;
  if (!resolved && name) {
    const lc = name.toLowerCase();
    if (lc.includes('vijayavani')) legacySrc = IMAGES.vijayavani;
    else if (lc.includes('prajavani')) legacySrc = IMAGES.prajavani;
    else if (lc.includes('hindu')) legacySrc = IMAGES.theHindu;
    else if (lc.includes('times')) legacySrc = IMAGES.timesOfIndia;
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
          borderWidth: hasImage ? 0 : 2,
          borderColor: hasImage ? 'transparent' : '#EF4444',
          borderStyle: hasImage ? 'solid' : 'dashed',
        },
      ]}
    >
      {hasImage ? (
        <Image
          source={finalSource}
          style={[styles.img, dims, { borderRadius: rounded }]}
          resizeMode="contain"
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
