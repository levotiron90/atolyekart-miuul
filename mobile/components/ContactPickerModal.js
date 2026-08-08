import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Contacts from "expo-contacts";
import { colors } from "../theme";

// Rehber izni reddedilirse veya kişi seçilmezse form elle doldurulmaya devam
// edilebilir — bu bileşen zorunlu bir adım değil, sadece bir kısayoldur.
export default function ContactPickerModal({ visible, onClose, onSelect }) {
  const [contacts, setContacts] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | denied | error | ready

  const loadContacts = async () => {
    setStatus("loading");
    try {
      const { status: permission } = await Contacts.requestPermissionsAsync();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });
      setContacts(data.filter((c) => c.name));
      setStatus("ready");
    } catch (err) {
      console.warn("Rehbere erişilemedi:", err);
      setStatus("error");
    }
  };

  const handleShow = () => {
    if (status === "idle") {
      loadContacts();
    }
  };

  const handleSelect = (contact) => {
    onSelect({
      name: contact.name || "",
      phone: contact.phoneNumbers?.[0]?.number || "",
      email: contact.emails?.[0]?.email || "",
    });
    setStatus("idle");
    setContacts([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onShow={handleShow}
      onRequestClose={onClose}
      transparent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Rehberden Seç</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>

          {status === "loading" && (
            <Text style={styles.info}>Rehber yükleniyor…</Text>
          )}
          {status === "denied" && (
            <Text style={styles.info}>
              Rehbere erişim izni verilmedi. Formu elle doldurabilirsiniz.
            </Text>
          )}
          {status === "error" && (
            <Text style={styles.info}>
              Rehbere erişilemedi. Formu elle doldurabilirsiniz.
            </Text>
          )}
          {status === "ready" && contacts.length === 0 && (
            <Text style={styles.info}>Rehberde kayıtlı kişi bulunamadı.</Text>
          )}

          {status === "ready" && contacts.length > 0 && (
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.contactRow}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.contactName}>{item.name}</Text>
                  {item.phoneNumbers?.[0]?.number ? (
                    <Text style={styles.contactDetail}>
                      {item.phoneNumbers[0].number}
                    </Text>
                  ) : null}
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(35, 26, 18, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  closeText: {
    color: colors.terracotta,
    fontWeight: "600",
  },
  info: {
    color: colors.muted,
    fontSize: 14,
    paddingVertical: 16,
  },
  list: {
    marginTop: 4,
  },
  contactRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  contactDetail: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
});
