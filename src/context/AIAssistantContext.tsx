import React, {createContext, useContext, useCallback, useRef} from 'react';

type AIAssistantContextType = {
  openAssistant: () => void;
  registerOpen: (fn: () => void) => void;
  registerCustomizationOpen: (fn: (() => void) | null) => void;
  openCustomizationAssistant: () => void;
};

const AIAssistantContext = createContext<AIAssistantContextType>({
  openAssistant: () => {},
  registerOpen: () => {},
  registerCustomizationOpen: () => {},
  openCustomizationAssistant: () => {},
});

export const useAIAssistant = () => useContext(AIAssistantContext);

export const AIAssistantProvider = ({children}: {children: React.ReactNode}) => {
  const openFnRef = useRef<(() => void) | null>(null);
  const customizationOpenFnRef = useRef<(() => void) | null>(null);

  const registerOpen = useCallback((fn: () => void) => {
    openFnRef.current = fn;
  }, []);

  const registerCustomizationOpen = useCallback((fn: (() => void) | null) => {
    customizationOpenFnRef.current = fn;
  }, []);

  const openAssistant = useCallback(() => {
    openFnRef.current?.();
  }, []);

  const openCustomizationAssistant = useCallback(() => {
    customizationOpenFnRef.current?.();
  }, []);

  return (
    <AIAssistantContext.Provider
      value={{
        openAssistant,
        registerOpen,
        registerCustomizationOpen,
        openCustomizationAssistant,
      }}>
      {children}
    </AIAssistantContext.Provider>
  );
};
