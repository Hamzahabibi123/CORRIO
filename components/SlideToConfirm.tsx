import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { colors, radius } from '../constants/colors';
import { Icon, type IconName } from './Icon';

const HANDLE = 48;
const PAD = 3;
const THRESHOLD = 0.92;

interface Props {
  /** Testo mostrato quando la slide è utilizzabile. */
  label: string;
  /** Testo mostrato quando `locked` è true (traccia disabilitata). */
  lockedLabel?: string;
  locked?: boolean;
  onConfirm: () => void;
  icon?: IconName;
  /** brand = barra rossa piena (fine sessione); default = barra chiara (conferma modifica). */
  variant?: 'brand' | 'default';
}

// Porting 1:1 del gesto "scorri per confermare" del riferimento CORRIO
// (.slide-track/.slide-handle, drag via pointer events) — qui con PanResponder.
// IMPORTANTE: il PanResponder viene creato una sola volta (useRef), quindi le sue
// callback NON possono leggere direttamente le prop più recenti (closure stale) —
// per questo `locked`/`max`/`onConfirm` vengono letti da dei ref sempre aggiornati,
// altrimenti il gesto si "congela" con lo stato del primo render (bug reale:
// la barra nasceva quasi sempre con `locked=true` e restava bloccata per sempre).
export function SlideToConfirm({ label, lockedLabel, locked, onConfirm, icon = 'stop', variant = 'default' }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const left = useRef(new Animated.Value(PAD)).current;
  const confirmedRef = useRef(false);

  const lockedRef = useRef(!!locked);
  const onConfirmRef = useRef(onConfirm);
  const maxRef = useRef(PAD);

  useEffect(() => { lockedRef.current = !!locked; }, [locked]);
  useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);

  const max = Math.max(PAD, trackWidth - HANDLE - PAD);
  useEffect(() => { maxRef.current = max; }, [max]);

  function reset() {
    confirmedRef.current = false;
    Animated.spring(left, { toValue: PAD, useNativeDriver: false, bounciness: 6 }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedRef.current,
      onStartShouldSetPanResponderCapture: () => !lockedRef.current,
      onMoveShouldSetPanResponder: () => !lockedRef.current,
      onMoveShouldSetPanResponderCapture: () => !lockedRef.current,
      onPanResponderGrant: () => {
        confirmedRef.current = false;
      },
      onPanResponderMove: (_evt, gesture) => {
        if (lockedRef.current) return;
        const m = maxRef.current;
        const next = Math.max(PAD, Math.min(m, PAD + gesture.dx));
        left.setValue(next);
        const progress = m > PAD ? (next - PAD) / (m - PAD) : 0;
        if (progress >= THRESHOLD && !confirmedRef.current) {
          confirmedRef.current = true;
          onConfirmRef.current();
        }
      },
      onPanResponderRelease: () => {
        if (!confirmedRef.current) reset();
      },
      onPanResponderTerminate: () => {
        if (!confirmedRef.current) reset();
      },
    })
  ).current;

  const fillWidth = Animated.add(left, HANDLE / 2);
  const labelOpacity = left.interpolate({
    inputRange: [PAD, Math.max(PAD + 1, max)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const isBrand = variant === 'brand';
  const trackStyle = [
    styles.track,
    isBrand ? styles.trackBrand : styles.trackDefault,
    locked && (isBrand ? styles.trackBrandLocked : styles.trackLocked),
  ];
  const fillStyle = isBrand ? styles.fillBrand : styles.fillDefault;
  const labelStyle = [styles.label, isBrand && styles.labelBrand, locked && styles.labelLocked];
  const handleStyle = [styles.handle, isBrand ? styles.handleBrand : styles.handleDefault, locked && styles.handleLocked];
  const handleIconColor = locked ? colors.muted : isBrand ? colors.brand : colors.white;

  return (
    <View style={trackStyle} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.fill, fillStyle, { width: fillWidth }]} />
      <Animated.Text style={[labelStyle, { opacity: labelOpacity }]} numberOfLines={1}>
        {locked && lockedLabel ? lockedLabel : label}
      </Animated.Text>
      <Animated.View style={[handleStyle, { left }]} {...panResponder.panHandlers} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Icon name={icon} size={20} color={handleIconColor} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'relative',
    height: 54,
    borderRadius: radius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackDefault: { backgroundColor: '#f1f5f9' },
  trackBrand: { backgroundColor: colors.brand },
  trackLocked: { backgroundColor: colors.border },
  trackBrandLocked: { backgroundColor: colors.border },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.pill },
  fillDefault: { backgroundColor: colors.brandLight },
  fillBrand: { backgroundColor: 'rgba(255,255,255,0.28)' },
  label: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.muted },
  labelBrand: { color: colors.white },
  labelLocked: { color: colors.muted },
  handle: {
    position: 'absolute', top: PAD, width: HANDLE, height: HANDLE, borderRadius: HANDLE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  handleDefault: { backgroundColor: colors.brand },
  handleBrand: { backgroundColor: colors.white },
  handleLocked: { backgroundColor: colors.white },
});
