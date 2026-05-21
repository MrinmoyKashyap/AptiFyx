import { create } from 'zustand';
import { ActiveMode } from '@aptifyx/shared-types';
import { useAuthStore } from './auth-store';

interface ModeState {
  currentMode: ActiveMode;
  setMode: (mode: ActiveMode) => void;
}

export const useModeStore = create<ModeState>((set) => ({
  currentMode: ActiveMode.CUSTOMER,
  
  setMode: (mode) => {
    set({ currentMode: mode });
  }
}));

// Sync mode store with user's saved mode upon login
useAuthStore.subscribe((state, prevState) => {
  if (state.user && state.user !== prevState.user) {
    useModeStore.getState().setMode(state.user.activeMode);
  }
});
