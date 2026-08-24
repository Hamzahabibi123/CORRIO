import type { Role } from '../types';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: { role: Role };
  RegisterStep1: { role: Role };
  RegisterStep2: {
    role: Role;
    email: string;
    password: string;
  };
};

// Placeholder: verrà espanso schermata per schermata (Consegne/Storico/Profilo per il
// rider, Profilo/Rider/Storico/Statistiche per il manager).
export type RiderTabParamList = {
  Consegne: undefined;
  Storico: undefined;
  Profilo: undefined;
};

export type ManagerTabParamList = {
  Rider: undefined;
  StoricoManager: undefined;
  Statistiche: undefined;
  ProfiloManager: undefined;
};
