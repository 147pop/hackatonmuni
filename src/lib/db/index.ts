import type { DbStore } from './types';
import { localStorageStore } from './local-store';
import { supabaseStore } from './supabase-store';

const dataMode = process.env.NEXT_PUBLIC_DATA_MODE ?? 'localStorage';

export const db: DbStore = dataMode === 'supabase' ? supabaseStore : localStorageStore;

export { localStorageStore, supabaseStore };
export type { DbStore };