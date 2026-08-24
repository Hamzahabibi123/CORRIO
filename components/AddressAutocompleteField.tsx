import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../constants/colors';
import { searchAddressSuggestions, type AddressSuggestion } from '../services/geocode';

interface Props {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}

// TextField per l'indirizzo con suggerimenti sotto mentre si digita, tramite
// Nominatim (OpenStreetMap) — debounce di 500ms, minimo 3 caratteri. Toccare
// un suggerimento compila l'indirizzo completo (via, numero, città).
export function AddressAutocompleteField({ label, value, onChangeText, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!focused || value.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const myId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddressSuggestions(value);
      if (requestIdRef.current === myId) {
        setSuggestions(results);
        setLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);

  function handleSelect(s: AddressSuggestion) {
    onChangeText(s.label);
    setSuggestions([]);
    setFocused(false);
  }

  const showDropdown = focused && (suggestions.length > 0 || loading);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
        />
        {focused && loading && <ActivityIndicator size="small" color={colors.brand} style={styles.spinner} />}

        {showDropdown && (
          <View style={styles.dropdown}>
            {loading && suggestions.length === 0 ? (
              <Text style={styles.hintText}>Cerco indirizzi…</Text>
            ) : (
              suggestions.map((s) => (
                <Pressable key={s.id} style={styles.suggestionRow} onPress={() => handleSelect(s)}>
                  <Text style={styles.suggestionText} numberOfLines={2}>{s.label}</Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, zIndex: 20 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.muted, marginBottom: 5 },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    color: colors.ink,
  },
  spinner: { position: 'absolute', right: 12, top: 13 },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, maxHeight: 220, overflow: 'hidden',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
    zIndex: 30,
  },
  suggestionRow: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionText: { fontSize: 13.5, color: colors.ink },
  hintText: { fontSize: 12.5, color: colors.muted, paddingHorizontal: 12, paddingVertical: 10 },
});
