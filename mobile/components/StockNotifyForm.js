import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { formStyles as styles } from "./formStyles";
import { emailRegex, getProductId, sendToWebhook } from "../lib/api";

export default function StockNotifyForm({ product, variant, onSubmitted }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (sending) return;
    if (!name.trim()) {
      Alert.alert("Eksik bilgi", "Lütfen ad soyad girin.");
      return;
    }
    if (!emailRegex.test(email)) {
      Alert.alert("Geçersiz e-posta", "Lütfen geçerli bir e-posta adresi girin (örn. ad@ornek.com).");
      return;
    }
    if (!consent) {
      Alert.alert("Onay gerekli", "Devam etmek için KVKK Aydınlatma Metni'ni kabul etmeniz gerekiyor.");
      return;
    }
    setSending(true);
    const success = await sendToWebhook({
      event: "stock_notification.requested",
      name,
      productId: getProductId(product.name, variant.name),
      productName: `${product.name} — ${variant.name}`,
      email,
      source: "atolyekart-mobile",
      kvkkConsent: consent,
      consentAt: new Date().toISOString(),
      policyVersion: "2026-08-02",
    });
    setSending(false);
    onSubmitted(success);
  };

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={styles.label}>Ad Soyad</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={200} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          maxLength={200}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.consentRow}
        onPress={() => setConsent((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
          {consent && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={styles.consentText}>
          Kişisel verilerimin stok bildirimi talebimin değerlendirilmesi
          amacıyla işlenmesini KVKK Aydınlatma Metni kapsamında kabul
          ediyorum.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.submitButton,
          styles.submitButtonSecondary,
          (sending || !consent) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={sending || !consent}
      >
        <Text style={styles.submitButtonText}>
          {sending ? "Gönderiliyor…" : "Haber Ver"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
