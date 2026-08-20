import { create } from 'zustand';

const initialTheme = localStorage.getItem('ewallet_theme') || 'dark';

// Apply initial class on load
if (initialTheme === 'light') {
  document.documentElement.classList.add('light');
} else {
  document.documentElement.classList.remove('light');
}

export const useThemeStore = create((set, get) => ({
  theme: initialTheme,

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('ewallet_theme', newTheme);

    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    set({ theme: newTheme });
  }
}));
