import { useEffect } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "./components/ProductCard";
import { CARD_DATA } from "./data/card";
import { ensureAuthToken } from "./lib/api";
import { colors } from "./theme";

function AppContent() {
  useEffect(() => {
    ensureAuthToken();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.brand}>
            Lather <Text style={styles.brandAccent}>&amp;</Text> Lull
          </Text>
          <Text style={styles.tagline}>Doğal ve Sürdürülebilir Bakım</Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.categoryLabel}>Katalog</Text>
          <Text style={styles.sectionTitle}>El Yapımı Bakım Koleksiyonumuz</Text>
        </View>

        {CARD_DATA.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}

        <Text style={styles.footer}>
          © 2026 Lather &amp; Lull — Doğal &amp; Sürdürülebilir Bakım
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
  },
  brand: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
  },
  brandAccent: {
    fontStyle: "italic",
    color: colors.terracotta,
  },
  tagline: {
    marginTop: 4,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.terracotta,
    fontWeight: "600",
  },
  sectionHeading: {
    alignItems: "center",
    marginBottom: 18,
  },
  categoryLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.terracotta,
    fontWeight: "600",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    marginTop: 16,
  },
});
