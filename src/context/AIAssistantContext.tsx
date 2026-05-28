import React, {createContext, useContext, useState, useCallback} from 'react';

type AIAssistantContextType = {
  openAssistant: () => void;
  registerOpen: (fn: () => void) => void;
};

const AIAssistantContext = createContext<AIAssistantContextType>({
  openAssistant: () => {},
  registerOpen: () => {},
});

export const useAIAssistant = () => useContext(AIAssistantContext);

export const AIAssistantProvider = ({children}: {children: React.ReactNode}) => {
  const [openFn, setOpenFn] = useState<(() => void) | null>(null);

  const registerOpen = useCallback((fn: () => void) => {
    setOpenFn(() => fn);
  }, []);

  const openAssistant = useCallback(() => {
    openFn?.();
  }, [openFn]);

  return (
    <AIAssistantContext.Provider value={{openAssistant, registerOpen}}>
      {children}
    </AIAssistantContext.Provider>
  );
};
