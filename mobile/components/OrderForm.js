import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { formStyles as styles } from "./formStyles";
import ContactPickerModal from "./ContactPickerModal";
import { emailRegex, getProductId, sendToWebhook } from "../lib/api";

const COUNTRY_CODES = [
  { flag: "🇹🇷", code: "+90", label: "Türkiye" },
  { flag: "🇺🇸", code: "+1", label: "ABD" },
  { flag: "🇩🇪", code: "+49", label: "Almanya" },
  { flag: "🇬🇧", code: "+44", label: "İngiltere" },
];

export default function OrderForm({ product, variant, onSubmitted }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactPickerVisible, setContactPickerVisible] = useState(false);

  const unitPrice = Number(variant.price.replace(/\D/g, "")) || 0;
  const totalPrice = unitPrice * (Number(quantity) || 0);

  const handleContactSelect = (contact) => {
    if (contact.name) setName(contact.name);
    if (contact.email) setEmail(contact.email);
    if (contact.phone) setPhone(contact.phone);
  };

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
    if (!phone.trim()) {
      Alert.alert("Eksik bilgi", "Lütfen telefon numarası girin.");
      return;
    }
    if (!consent) {
      Alert.alert("Onay gerekli", "Devam etmek için KVKK Aydınlatma Metni'ni kabul etmeniz gerekiyor.");
      return;
    }
    setSending(true);
    const success = await sendToWebhook({
      event: "order.created",
      name,
      productId: getProductId(product.name, variant.name),
      productName: `${product.name} — ${variant.name}`,
      phone: `${countryCode} ${phone}`,
      email,
      quantity: Number(quantity) || 1,
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
      <TouchableOpacity
        style={styles.contactButton}
        onPress={() => setContactPickerVisible(true)}
      >
        <Text style={styles.contactButtonText}>Rehberden Seç</Text>
      </TouchableOpacity>
      <ContactPickerModal
        visible={contactPickerVisible}
        onClose={() => setContactPickerVisible(false)}
        onSelect={handleContactSelect}
      />

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

      <View style={styles.field}>
        <Text style={styles.label}>Telefon</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ borderWidth: 1, borderColor: "#ecdece", borderRadius: 8, overflow: "hidden" }}>
            <Picker
              selectedValue={countryCode}
              onValueChange={setCountryCode}
              style={{ width: 130 }}
            >
              {COUNTRY_CODES.map((c) => (
                <Picker.Item key={c.code} label={`${c.flag} ${c.code}`} value={c.code} />
              ))}
            </Picker>
          </View>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={phone}
            onChangeText={setPhone}
            maxLength={30}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Adet</Text>
        <TextInput
          style={[styles.input, { width: 80 }]}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          backgroundColor: "#f3ded0",
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ fontSize: 13, color: "#33281f" }}>Toplam Tutar</Text>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#b0793f" }}>₺{totalPrice}</Text>
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
          Kişisel verilerimin siparişimin oluşturulması ve tarafımla iletişime
          geçilmesi amacıyla işlenmesini KVKK Aydınlatma Metni kapsamında
          kabul ediyorum.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, (sending || !consent) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={sending || !consent}
      >
        <Text style={styles.submitButtonText}>
          {sending ? "Gönderiliyor…" : "Siparişi Onayla"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
