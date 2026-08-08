import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import ProductImage from "./ProductImage";
import OrderForm from "./OrderForm";
import StockNotifyForm from "./StockNotifyForm";
import { getProductId } from "../lib/api";
import { STOCK } from "../data/stock";
import { colors } from "../theme";

export default function ProductCard({ product }) {
  const [variantIndex, setVariantIndex] = useState(0);
  const [actionOpen, setActionOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null | "success" | "error"
  const variant = product.variants[variantIndex];
  const productId = getProductId(product.name, variant.name);
  const inStock = STOCK[productId] !== false;

  useEffect(() => {
    setActionOpen(false);
    setSubmitStatus(null);
  }, [variantIndex]);

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <ProductImage imageUrl={product.imageUrl} alt={product.alt} />
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{variant.price}</Text>
          <Text style={styles.priceNote}>{variant.priceNote}</Text>
        </View>
        {!inStock && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>Tükendi</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{product.name}</Text>

        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={variantIndex}
            onValueChange={(value) => setVariantIndex(value)}
          >
            {product.variants.map((v, index) => (
              <Picker.Item key={v.name} label={`${v.name} — ${v.subtitle}`} value={index} />
            ))}
          </Picker>
        </View>

        <View style={styles.tagRow}>
          {variant.tags.map((tag) => (
            <View style={styles.tag} key={tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.description}>{variant.description}</Text>

        {submitStatus === "success" ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              {inStock
                ? "Siparişiniz alındı, teşekkürler! En kısa sürede sizinle iletişime geçeceğiz."
                : "Talebiniz alındı — ürün stoğa girdiğinde size haber vereceğiz."}
            </Text>
          </View>
        ) : submitStatus === "error" ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>
              Şu anda yoğunluk var, isteğiniz iletilemedi. Lütfen bir dakika sonra tekrar deneyin.
            </Text>
          </View>
        ) : actionOpen ? (
          inStock ? (
            <OrderForm
              product={product}
              variant={variant}
              onSubmitted={(success) => setSubmitStatus(success ? "success" : "error")}
            />
          ) : (
            <StockNotifyForm
              product={product}
              variant={variant}
              onSubmitted={(success) => setSubmitStatus(success ? "success" : "error")}
            />
          )
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, !inStock && styles.actionButtonSecondary]}
            onPress={() => setActionOpen(true)}
          >
            <Text style={styles.actionButtonText}>
              {inStock ? "Sipariş Ver" : "Stok Bildirimi İste"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
  },
  imageWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.accentSoft,
    position: "relative",
  },
  priceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  priceBadgeText: {
    color: colors.priceBadge,
    fontWeight: "700",
    fontSize: 15,
  },
  priceNote: {
    fontSize: 10,
    color: colors.muted,
    fontStyle: "italic",
  },
  stockBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(35, 26, 18, 0.82)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stockBadgeText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
  body: {
    padding: 18,
    gap: 10,
  },
  title: {
    fontSize: 19,
    fontWeight: "600",
    color: colors.text,
  },
  pickerWrap: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: "hidden",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "500",
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: colors.terracotta,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionButtonSecondary: {
    backgroundColor: colors.accent,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  successBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    padding: 12,
  },
  successText: {
    color: colors.text,
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: colors.terracottaSoft,
    borderRadius: 10,
    padding: 12,
  },
  errorBoxText: {
    color: colors.text,
    fontSize: 13,
  },
});
