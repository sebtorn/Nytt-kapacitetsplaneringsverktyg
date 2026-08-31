import { useState } from 'react';
import { AppState } from '../types';

const STORAGE_KEY = 'capacity-planner-state';

/**
 * Custom hook för att hantera state i localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook specifikt för app-state
 */
export function useAppState(): [AppState, (updater: AppState | ((prev: AppState) => AppState)) => void] {
  const initialState: AppState = {
    teamMembers: [],
    sprints: [],
    workItems: [],
    deliveries: []
  };

  const [state, setState] = useLocalStorage<AppState>(STORAGE_KEY, initialState);

  return [state, setState as (updater: AppState | ((prev: AppState) => AppState)) => void];
}

/**
 * Rensar all data från localStorage
 */
export function clearAllData(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

/**
 * Exporterar current state som JSON
 */
export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Importerar state från JSON
 */
export function importState(jsonString: string): AppState {
  try {
    const parsed = JSON.parse(jsonString);
    // Validera och konvertera datum
    const validatedState: AppState = {
      teamMembers: parsed.teamMembers || [],
      sprints: parsed.sprints ? parsed.sprints.map((s: any) => ({
        ...s,
        startDate: new Date(s.startDate),
        endDate: new Date(s.endDate)
      })) : [],
      workItems: parsed.workItems || [],
      deliveries: parsed.deliveries ? parsed.deliveries.map((d: any) => ({
        ...d,
        targetDate: new Date(d.targetDate)
      })) : []
    };
    return validatedState;
  } catch (error) {
    console.error('Error importing state:', error);
    return {
      teamMembers: [],
      sprints: [],
      workItems: [],
      deliveries: []
    };
  }
}
