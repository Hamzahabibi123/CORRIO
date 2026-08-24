import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { colors, spacing } from '../constants/colors';
import { Icon } from './Icon';
import { PrimaryButton } from './PrimaryButton';
import { shareGeneratedFile, type GeneratedFile } from '../services/export';

interface Props {
  visible: boolean;
  onClose: () => void;
  file: GeneratedFile | null;
  /** Solo per il CSV: il contenuto testuale da mostrare nell'anteprima (per il PDF si usa la WebView sul file). */
  csvContent?: string;
}

// Anteprima in-app del file esportato PRIMA di condividerlo/salvarlo: per il PDF
// mostra il documento vero e proprio in una WebView (pinch-zoom nativo), per il
// CSV/Excel mostra il contenuto testuale del file. Solo dal pulsante in fondo si
// apre il foglio nativo di condivisione/salvataggio.
export function ExportPreviewModal({ visible, onClose, file, csvContent }: Props) {
  const [sharing, setSharing] = useState(false);
  const [webviewLoading, setWebviewLoading] = useState(true);

  async function handleShare() {
    if (!file) return;
    setSharing(true);
    try {
      await shareGeneratedFile(file);
    } catch (e) {
      Alert.alert('Condivisione non riuscita', e instanceof Error ? e.message : String(e));
    } finally {
      setSharing(false);
    }
  }

  const isPdf = file?.mimeType === 'application/pdf';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{file?.fileName || 'Anteprima'}</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={18} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {!file ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
          ) : isPdf ? (
            <View style={{ flex: 1 }}>
              <WebView
                source={{ uri: file.uri }}
                style={{ flex: 1, backgroundColor: colors.bg }}
                originWhitelist={['*']}
                onLoadEnd={() => setWebviewLoading(false)}
              />
              {webviewLoading && (
                <View style={[StyleSheet.absoluteFillObject, styles.center]}>
                  <ActivityIndicator size="large" color={colors.brand} />
                </View>
              )}
            </View>
          ) : (
            <ScrollView style={styles.csvOuter} contentContainerStyle={{ padding: spacing.lg }}>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <Text style={styles.csvText}>{csvContent}</Text>
              </ScrollView>
            </ScrollView>
          )}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={Platform.OS === 'ios' ? 'Condividi / Salva' : 'Condividi o salva'}
            onPress={handleShare}
            loading={sharing}
            disabled={!file}
            icon={<Icon name="download" size={16} color={colors.white} />}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1, marginRight: spacing.sm },
  closeBtn: { padding: 6 },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  csvOuter: { flex: 1 },
  csvText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12.5, color: colors.ink, lineHeight: 19,
  },
  footer: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card,
  },
});
