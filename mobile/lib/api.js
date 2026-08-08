import AsyncStorage from "@react-native-async-storage/async-storage";

// Backend, web sürümüyle paylaşılan Vercel projesi — bkz. ../../api/token.js,
// ../../api/webhook.js. Mobil, aynı origin olmadığı için tam URL kullanır.
export const API_BASE_URL = "https://atolyekart-two.vercel.app";

const JWT_STORAGE_KEY = "atolyekart_jwt";

export function slugify(text) {
  const trMap = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i" };
  return text
    .split("")
    .map((ch) => trMap[ch] || ch)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProductId(productName, variantName) {
  return `${slugify(productName)}_${slugify(variantName)}`;
}

export const emailRegex = /^(?=.*@)(?=.*\.com).+$/i;

async function fetchAuthToken() {
  const res = await fetch(`${API_BASE_URL}/api/token`);
  if (!res.ok) {
    throw new Error(`Token alınamadı: ${res.status}`);
  }
  const data = await res.json();
  try {
    await AsyncStorage.setItem(JWT_STORAGE_KEY, data.token);
  } catch (err) {
    console.warn("AsyncStorage'a token yazılamadı:", err);
  }
  return data.token;
}

// Web sürümündeki sendToWebhook ile aynı sözleşme: token'ı Authorization
// header'ı olarak ekler, 401 alırsa yeni token alıp bir kez daha dener,
// gerçek başarı/başarısızlık durumunu true/false olarak döner (sessizce
// "başarılı" varsaymaz).
export async function sendToWebhook(payload) {
  let success = false;
  try {
    let token = null;
    try {
      token = await AsyncStorage.getItem(JWT_STORAGE_KEY);
    } catch (err) {
      console.warn("AsyncStorage okunamadı:", err);
    }

    let response = await fetch(`${API_BASE_URL}/api/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      token = await fetchAuthToken();
      response = await fetch(`${API_BASE_URL}/api/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      console.warn("Webhook isteği başarısız:", response.status);
    } else {
      success = true;
    }
  } catch (err) {
    console.warn("Webhook'a ulaşılamadı:", err);
  }
  return success;
}

export async function ensureAuthToken() {
  let existingToken = null;
  try {
    existingToken = await AsyncStorage.getItem(JWT_STORAGE_KEY);
  } catch (err) {
    console.warn("AsyncStorage okunamadı:", err);
  }
  if (!existingToken) {
    try {
      await fetchAuthToken();
    } catch (err) {
      console.warn("Token alınamadı:", err);
    }
  }
}
