import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {MarketCode} from '../data/markets';
import {getMarket} from '../data/markets';

const MARKET_KEY = '@carmodapp/market';

type MarketContextType = {
  countryCode: MarketCode;
  setCountryCode: (code: MarketCode) => void;
};

const MarketContext = createContext<MarketContextType>({
  countryCode: 'LB',
  setCountryCode: () => {},
});

export const useMarket = () => useContext(MarketContext);

export const MarketProvider = ({children}: {children: React.ReactNode}) => {
  const [countryCode, setCountryCodeState] = useState<MarketCode>('LB');

  useEffect(() => {
    AsyncStorage.getItem(MARKET_KEY).then(saved => {
      if (saved && getMarket(saved)) {
        setCountryCodeState(saved as MarketCode);
      }
    });
  }, []);

  const setCountryCode = (code: MarketCode) => {
    setCountryCodeState(code);
    AsyncStorage.setItem(MARKET_KEY, code);
  };

  return (
    <MarketContext.Provider value={{countryCode, setCountryCode}}>
      {children}
    </MarketContext.Provider>
  );
};
