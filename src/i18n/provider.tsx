import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { LANGUAGE_KEY, isLanguage, setCurrentLanguage, type Language } from './engine';
const Context = createContext<{ language: Language; changeLanguage: (next: Language) => Promise<void> }>({ language: 'en', changeLanguage: async () => {} });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [ready, setReady] = useState(false);
  useEffect(() => { let mounted = true;
    void AsyncStorage.getItem(LANGUAGE_KEY).then(saved => {
      if (mounted && isLanguage(saved)) { setCurrentLanguage(saved); setLanguage(saved); }
    }).catch(() => {}).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  async function changeLanguage(next: Language) {
    await AsyncStorage.setItem(LANGUAGE_KEY, next);
    setCurrentLanguage(next); setLanguage(next);
  }
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#FAFAFC', justifyContent: 'center' }}><ActivityIndicator color="#4162F6" /></View>;
  return <Context.Provider value={{ language, changeLanguage }}>{children}</Context.Provider>;
}
export function useLanguage() { return useContext(Context); }
