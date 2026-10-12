import { messages } from './catalog.ts';
export const languages = [
  { id: 'en', name: 'English', locale: 'en' },
  { id: 'ar', name: 'العربية', locale: 'ar' },
  { id: 'zh', name: '中文', locale: 'zh-CN' },
  { id: 'es', name: 'Español', locale: 'es' },
  { id: 'hi', name: 'हिन्दी', locale: 'hi' },
] as const;
export type Language = typeof languages[number]['id'];
export const LANGUAGE_KEY = 'parkd.language.v1';
let current: Language = 'en';
const catalog = new Map(messages.map(row => [row[0], row]));
export function isLanguage(value: unknown): value is Language { return languages.some(item => item.id === value); }
export function setCurrentLanguage(language: Language) { current = language; }
export function hasMessage(message: string) { return catalog.has(message); }
export function getLanguage() { return current; }
export function getLocale() { return languages.find(item => item.id === current)!.locale; }
export function isRTL() { return current === 'ar'; }
export function number(value: number) { return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(value); }
export function t(message: string, params: Record<string, string | number> = {}): string {
  const row = catalog.get(message);
  const translated = row?.[languages.findIndex(item => item.id === current)] ?? message;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in params)) return match;
    const value = typeof params[key] === 'number' ? number(params[key] as number) : String(params[key]);
    // Isolate entered landmarks/codes so mixed Arabic and Latin stay readable.
    return isRTL() ? `\u2068${value}\u2069` : value;
  });
}
