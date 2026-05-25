import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppTheme = "red" | "blue" | "cyber" | "amoled" | "white";

export const ThemePalettes = {
  red: {
    background: "#0F0E13", 
    card: "#16151B",
    text: "#FFFFFF",
    subText: "#94A3B8",
    primary: "#EF4444", 
    secondary: "#1F2937",
    border: "#24232C",
    accent: "#450A0A",
    input: "#16151B",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
    gradients: {
      primary: ["#EF4444", "#B91C1C"] as const,
      secondary: ["#1F2937", "#111827"] as const,
      danger: ["#EF4444", "#B91C1C"] as const,
      surface: ["#16151B", "#0F0E13"] as const,
    }
  },
  blue: {
    background: "#0B132B", 
    card: "#1C2541",
    text: "#FFFFFF",
    subText: "#94A3B8",
    primary: "#00B4D8", 
    secondary: "#1F2937",
    border: "#3A506B",
    accent: "#03045E",
    input: "#1C2541",
    success: "#10B981",
    warning: "#FBBF24",
    danger: "#EF4444",
    info: "#3B82F6",
    gradients: {
      primary: ["#00B4D8", "#0077B6"] as const,
      secondary: ["#1C2541", "#0B132B"] as const,
      danger: ["#EF4444", "#B91C1C"] as const,
      surface: ["#1C2541", "#0B132B"] as const,
    }
  },
  cyber: {
    background: "#0D0E15", 
    card: "#1A1C28",
    text: "#FFFFFF",
    subText: "#A0AEC0",
    primary: "#00F5D4", 
    secondary: "#1F2937",
    border: "#2D3748",
    accent: "#7B2CBF",
    input: "#1A1C28",
    success: "#00F5D4",
    warning: "#FBBF24",
    danger: "#EF4444",
    info: "#3B82F6",
    gradients: {
      primary: ["#00F5D4", "#7B2CBF"] as const,
      secondary: ["#1A1C28", "#0D0E15"] as const,
      danger: ["#EF4444", "#B91C1C"] as const,
      surface: ["#1A1C28", "#0D0E15"] as const,
    }
  },
  amoled: {
    background: "#000000", 
    card: "#0C0C0C",
    text: "#FFFFFF",
    subText: "#A0A0A0",
    primary: "#E11D48", 
    secondary: "#1F2937",
    border: "#1E1E1E",
    accent: "#27272A",
    input: "#0C0C0C",
    success: "#10B981",
    warning: "#FBBF24",
    danger: "#EF4444",
    info: "#3B82F6",
    gradients: {
      primary: ["#E11D48", "#BE123C"] as const,
      secondary: ["#0C0C0C", "#000000"] as const,
      danger: ["#EF4444", "#B91C1C"] as const,
      surface: ["#0C0C0C", "#000000"] as const,
    }
  },
  white: {
    background: "#F8FAFC", 
    card: "#FFFFFF",
    text: "#0F172A",
    subText: "#64748B",
    primary: "#EF4444", 
    secondary: "#1F2937",
    border: "#E2E8F0",
    accent: "#FEF2F2",
    input: "#F8FAFC",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
    gradients: {
      primary: ["#EF4444", "#B91C1C"] as const,
      secondary: ["#1F2937", "#111827"] as const,
      danger: ["#EF4444", "#B91C1C"] as const,
      surface: ["#FFFFFF", "#F1F5F9"] as const,
    }
  }
};

type GradientType = readonly [string, string, ...string[]];

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  subText: string;
  primary: string;
  secondary: string;
  border: string;
  accent: string;
  input: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  gradients: {
    primary: GradientType;
    secondary: GradientType;
    danger: GradientType;
    surface: GradientType;
  };
}

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<AppTheme>("red");

  useEffect(() => {
    AsyncStorage.getItem("themePreference").then((saved) => {
      if (saved) {
        if (["red", "blue", "cyber", "amoled", "white"].includes(saved)) {
          setCurrentTheme(saved as AppTheme);
        } else {
          setCurrentTheme("red");
        }
      }
    });
  }, []);

  const setTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
    AsyncStorage.setItem("themePreference", theme);
  };

  const isDarkMode = currentTheme !== "white";

  const toggleTheme = () => {
    const themes: AppTheme[] = ["red", "blue", "cyber", "amoled", "white"];
    const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const colors = ThemePalettes[currentTheme];

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, currentTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
