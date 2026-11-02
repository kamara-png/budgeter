import Ionicons from "@expo/vector-icons/Ionicons";
import { format } from "date-fns";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChangelogBody } from "@/components/updates/ChangelogBody";
import { useTheme } from "@/hooks/useTheme";
import {
  bundledChangelog,
  getLastSeenUpdateId,
  markUpdateSeen,
  newestEntry,
} from "@/utils/updates";

const newest = newestEntry(bundledChangelog);

function publishedLabel(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : format(date, "d MMM yyyy");
}

/**
 * One-time "what's new" dialog, shown once per downloaded over-the-air update.
 *
 * Nothing renders on the embedded (installed) bundle, in Expo Go, or in dev
 * builds, and nothing renders on web — `WhatsNewModal.web.tsx` replaces this
 * file there so `expo-updates` never enters the web bundle.
 */
export function WhatsNewModal() {
  const { colors } = useTheme();
  const updateId = Updates.updateId;
  const [lastSeen, setLastSeen] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getLastSeenUpdateId().then((id) => {
      if (active) setLastSeen(id);
    });
    return () => {
      active = false;
    };
  }, []);

  const visible =
    Updates.isEnabled &&
    !Updates.isEmbeddedLaunch &&
    updateId !== null &&
    lastSeen !== undefined &&
    lastSeen !== updateId;

  if (!visible || !updateId) return null;

  const close = () => {
    setLastSeen(updateId);
    void markUpdateSeen(updateId);
  };

  const subtitle = newest
    ? [`Version ${newest.version}`, publishedLabel(newest.publishedAt)]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.badge, { backgroundColor: `${colors.primary}1F` }]}>
            <Ionicons name="sparkles" size={22} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            You&apos;re up to date
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textFaint }]}>
              {subtitle}
            </Text>
          ) : null}

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {newest ? (
              <ChangelogBody entry={newest} />
            ) : (
              <Text style={[styles.fallback, { color: colors.textSecondary }]}>
                This update came without release notes.
              </Text>
            )}
          </ScrollView>

          <Pressable
            onPress={close}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderRadius: 24,
    padding: 22,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  body: {
    marginTop: 18,
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    paddingBottom: 4,
  },
  fallback: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 22,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
