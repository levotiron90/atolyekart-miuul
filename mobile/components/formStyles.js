import { StyleSheet } from "react-native";
import { colors } from "../theme";

// OrderForm ve StockNotifyForm arasında paylaşılan stiller.
export const formStyles = StyleSheet.create({
  form: {
    gap: 10,
    paddingTop: 4,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  input: {
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  contactButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    marginBottom: 2,
  },
  contactButtonText: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 12,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.terracotta,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  submitButton: {
    backgroundColor: colors.terracotta,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonSecondary: {
    backgroundColor: colors.accent,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: colors.terracotta,
    fontSize: 13,
    marginTop: -2,
  },
});
