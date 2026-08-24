# CORRIO Mobile (Expo + React Native + TypeScript)

Porting dell'app web CORRIO (`CHORRIO_APP/pizza-orders-app.html`) su iOS/Android.
Stesso backend Supabase, non modificato: stesso URL, stessa publishable key,
stesse tabelle/RLS/RPC (`services/supabase.ts`, `services/auth.ts`).

## Setup

Richiede **Node.js ≥ 20.19.4** (consigliato: gestirlo con [nvm](https://github.com/nvm-sh/nvm)).

```bash
npm install
npx expo install --check   # allinea le versioni delle librerie native alla SDK Expo
npx expo start
```

Poi scansiona il QR code con l'app **Expo Go** (fotocamera su iPhone, app Expo Go su
Android). Telefono e computer devono essere sulla stessa rete WiFi — se non funziona,
usa `npx expo start --tunnel`.

### Perché Expo SDK 54 e non l'ultima versione

Il progetto è pinnato su **Expo SDK 54** (non l'ultima, la 57) perché è l'ultima SDK
supportata dalla build di Expo Go pubblicata sull'App Store di Apple — le versioni
più recenti richiedono `eas go` o un dev client custom, che è un passo in più non
necessario in questa fase di test. Quando servirà (es. per moduli nativi come
fotocamera/GPS non coperti da Expo Go) si passerà a un dev client dedicato.

## Struttura

```
/screens       Schermate (una per view dell'app web)
/components    Componenti UI riusabili (PrimaryButton, TextField, AuthMessage, ...)
/services      Client Supabase + funzioni di accesso dati (auth.ts, supabase.ts, ...)
/navigation    React Navigation: AuthStack, MainNavigator (tabs), RootNavigator
/hooks         Stato globale con Zustand (useAuthStore) + hook custom
/types         Tipi che rispecchiano lo schema Supabase e lo stato applicativo
```

## Stato di avanzamento

- [x] Scaffold progetto + dipendenze (`@supabase/supabase-js`, React Navigation, Zustand)
- [x] Client Supabase con persistenza sessione via AsyncStorage
- [x] Store Zustand (`useAuthStore`): login, signUp manager/rider, logout, restore sessione, update profilo, stato rider attivo
- [x] Flusso autenticazione: Welcome (scelta ruolo) → Login → RegisterStep1 → RegisterStep2 (campi condizionali manager/rider, validazione codice business)
- [x] RootNavigator: AuthStack ↔ MainNavigator in base alla sessione, con restore automatico all'avvio
- [ ] Tab Rider: Consegne, Storico, Profilo
- [ ] Tab Manager: Profilo, Rider, Storico, Statistiche
- [ ] Notifiche push, GPS, fotocamera (vedi sezione "Decisioni native" in chat)

## Note di conversione

- Il flusso "ruolo → registrati/accedi" con fade CSS è diventato uno stack nativo
  (`AuthStack`) con back gesture di sistema, più naturale su mobile.
- Le password/coordinate Supabase sono le stesse dell'app web: nessuna modifica al
  backend, come richiesto.
- Login con Google non è ancora cablato lato mobile (richiede `expo-auth-session` +
  deep link dedicato): stessa limitazione già presente lato web, dove il provider
  Google non è ancora configurato su Supabase.
