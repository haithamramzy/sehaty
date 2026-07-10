import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { color, radius, shadow, space, tint } from '@/theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Standard bottom sheet: dim scrim + rounded panel that slides up from the bottom. */
export function Sheet({ visible, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.grabber} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tint.scrim },
  panel: {
    backgroundColor: color.bgRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    ...shadow.sheet,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.borderMuted,
    alignSelf: 'center',
    marginBottom: space.lg,
  },
});
