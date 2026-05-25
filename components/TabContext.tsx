import React, { createContext, useContext } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';

const TabContext = createContext<any>(null);

export const TabProvider = ({ children }: { children: React.ReactNode }) => {
  const translateY = useSharedValue(0);

  const hideTabBar = () => {
    translateY.value = withTiming(100, { duration: 300 });
  };

  const showTabBar = () => {
    translateY.value = withTiming(0, { duration: 300 });
  };

  return (
    <TabContext.Provider value={{ translateY, hideTabBar, showTabBar }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => useContext(TabContext);
