import { createBackup, readBackup, maxBackupBytes } from "./backup.js";

const format = "kdmid-encrypted-vault";
const iterations = 600000;
const aad = new TextEncoder().encode(`${format}:1`);
export const sessionLifetime = 15 * 60 * 1000;

export function encode(bytes) {
  return btoa(Array.from(new Uint8Array(bytes), (byte) => String.fromCharCode(byte)).join(""));
}

function decode(text, max) {
  if (typeof text !== "string" || text.length > max || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error("Повреждённое зашифрованное хранилище.");
  try { return Uint8Array.from(atob(text), (char) => char.charCodeAt(0)); }
  catch { throw new Error("Повреждённое зашифрованное хранилище."); }
}

export function parseVault(input) {
  let vault = input;
  if (typeof input === "string") {
    if (new TextEncoder().encode(input).length > maxBackupBytes * 2) throw new Error("Файл слишком большой.");
    try { vault = JSON.parse(input.replace(/^\uFEFF/, "")); }
    catch { throw new Error("Не удалось прочитать файл экспорта."); }
  }
  if (!vault || vault.format !== format || vault.version !== 1 || vault.kdf !== "PBKDF2-SHA256" || vault.iterations !== iterations || vault.cipher !== "AES-256-GCM") throw new Error("Это не поддерживаемое зашифрованное хранилище.");
  if (decode(vault.salt, 24).length !== 16 || decode(vault.iv, 16).length !== 12 || decode(vault.data, maxBackupBytes * 2).length < 16) throw new Error("Повреждённое зашифрованное хранилище.");
  return { format, version: 1, kdf: vault.kdf, iterations, cipher: vault.cipher, salt: vault.salt, iv: vault.iv, data: vault.data };
}

export async function deriveKey(password, salt) {
  if (typeof password !== "string" || password.length > 1024) throw new Error("Некорректный пароль.");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bytes = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: decode(salt, 24), iterations }, material, 256);
  return encode(bytes);
}

async function aesKey(raw) {
  const bytes = decode(raw, 44);
  if (bytes.length !== 32) throw new Error("Некорректный ключ хранилища.");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptPeople(people, raw, salt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(createBackup(people));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, await aesKey(raw), plaintext);
  return { format, version: 1, kdf: "PBKDF2-SHA256", iterations, cipher: "AES-256-GCM", salt, iv: encode(iv), data: encode(data) };
}

export async function decryptPeople(input, raw) {
  const vault = parseVault(input);
  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(vault.iv, 16), additionalData: aad }, await aesKey(raw), decode(vault.data, maxBackupBytes * 2));
  } catch { throw new Error("Неверный пароль или повреждённые данные."); }
  return readBackup(new TextDecoder().decode(plaintext));
}

export async function newVault(people, password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 1024) throw new Error("Пароль должен содержать от 12 до 1024 символов.");
  const salt = encode(crypto.getRandomValues(new Uint8Array(16)));
  const raw = await deriveKey(password, salt);
  return { vault: await encryptPeople(people, raw, salt), raw };
}
