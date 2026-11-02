import Ionicons from "@expo/vector-icons/Ionicons";
import { format } from "date-fns";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChangelogBody } from "@/components/updates/ChangelogBody";
import { useTheme } from "@/hooks/useTheme";
import type { ChangelogEntry } from "@/utils/updates";

interface Props {
  visible: boolean;
  loading: boolean;
  entry: ChangelogEntry | null;
  onDownload: () => void;
  onClose: () => void;
}

function publishedLabel(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : format(date, "d MMM yyyy");
}

/**
 * Pre-install changelog sheet: shown right after a check finds an update, before
 * the bundle is downloaded.
 */
export function UpdateSheet({
  visible,
  loading,
  entry,
  onDownload,
  onClose,
}: Props) {
  const { colors } = useTheme();

  const subtitle = entry
    ? [`Version ${entry.version}`, publishedLabel(entry.publishedAt)]
        .filter(Boolean)
        .join(" · ")
    : "A new update is available";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: `${colors.primary}1F` }]}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
            </View>
            <View style={styles.headerBody}>
              <Text style={[styles.title, { color: colors.text }]}>
                What&apos;s new
              </Text>
              <Text style={[styles.subtitle, { color: colors.textFaint }]}>
                {subtitle}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Looking up what&apos;s new…
                </Text>
              </View>
            ) : entry ? (
              <ChangelogBody entry={entry} />
            ) : (
              <Text style={[styles.fallback, { color: colors.textSecondary }]}>
                Install to see what&apos;s new in this update.
              </Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.ghostButton}>
              <Text style={[styles.ghostText, { color: colors.textSecondary }]}>
                Later
              </Text>
            </Pressable>
            <Pressable
              onPress={onDownload}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="cloud-download" size={16} color="#FFFFFF" />
              <Text style={styles.primaryText}>Download update</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    maxHeight: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 4,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBody: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  body: {
    marginTop: 16,
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    paddingBottom: 8,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
  },
  fallback: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  ghostButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ghostText: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
