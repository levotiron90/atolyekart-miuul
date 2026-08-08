import { useState } from "react";
import { Image, Text, View, StyleSheet } from "react-native";
import { colors } from "../theme";

export default function ProductImage({ imageUrl, alt }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{alt}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      accessibilityLabel={alt}
      style={styles.image}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
    padding: 16,
  },
  fallbackText: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
  },
});
