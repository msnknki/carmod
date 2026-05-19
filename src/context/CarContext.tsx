import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Car} from '../types';
import {api} from '../services/api';

const SELECTED_CAR_KEY = '@carmodapp/selectedCarId';

type CarContextType = {
  cars: Car[];
  selectedCar: Car | null;
  addCar: (car: Omit<Car, 'id'>) => Promise<void>;
  removeCar: (id: string) => Promise<void>;
  selectCar: (car: Car) => void;
  updateCarImage: (id: string, imageUri: string) => Promise<void>;
};

const CarContext = createContext<CarContextType>({
  cars: [],
  selectedCar: null,
  addCar: async () => {},
  removeCar: async () => {},
  selectCar: () => {},
  updateCarImage: async () => {},
});

export const useCar = () => useContext(CarContext);

export const CarProvider = ({children}: {children: React.ReactNode}) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  useEffect(() => {
    const loadCars = async () => {
      try {
        const [data, savedId] = await Promise.all([
          api.get('/cars') as Promise<any[]>,
          AsyncStorage.getItem(SELECTED_CAR_KEY),
        ]);

        const loaded: Car[] = data.map(c => ({
          id: String(c.id),
          make: c.make,
          model: c.model,
          year: c.year,
          imageUri: c.image_uri || undefined,
        }));

        setCars(loaded);

        if (loaded.length > 0) {
          const last = loaded.find(c => c.id === savedId);
          setSelectedCar(last ?? loaded[0]);
        }
      } catch {
        // backend unavailable — start with empty list
      }
    };
    loadCars();
  }, []);

  const addCar = async (carData: Omit<Car, 'id'>) => {
    try {
      const res = await api.post('/cars', carData);
      const car: Car = {
        id: String(res.id),
        make: res.make,
        model: res.model,
        year: res.year,
        imageUri: res.image_uri || undefined,
      };
      setCars(prev => [...prev, car]);
      if (!selectedCar) {
        setSelectedCar(car);
        AsyncStorage.setItem(SELECTED_CAR_KEY, car.id);
      }
    } catch {
      const car: Car = {...carData, id: Date.now().toString()};
      setCars(prev => [...prev, car]);
      if (!selectedCar) {
        setSelectedCar(car);
        AsyncStorage.setItem(SELECTED_CAR_KEY, car.id);
      }
    }
  };

  const removeCar = async (id: string) => {
    try {
      await api.del(`/cars/${id}`);
    } catch {
      // proceed with local removal even if backend call fails
    }
    setCars(prev => {
      const next = prev.filter(c => c.id !== id);
      if (selectedCar?.id === id) {
        const fallback = next[0] ?? null;
        setSelectedCar(fallback);
        if (fallback) {
          AsyncStorage.setItem(SELECTED_CAR_KEY, fallback.id);
        } else {
          AsyncStorage.removeItem(SELECTED_CAR_KEY);
        }
      }
      return next;
    });
  };

  const selectCar = (car: Car) => {
    setSelectedCar(car);
    AsyncStorage.setItem(SELECTED_CAR_KEY, car.id);
  };

  const updateCarImage = async (id: string, imageUri: string) => {
    try {
      await api.patch(`/cars/${id}`, {imageUri});
    } catch {
      // proceed locally even if backend call fails
    }
    setCars(prev => prev.map(c => (c.id === id ? {...c, imageUri} : c)));
    setSelectedCar(prev => (prev?.id === id ? {...prev, imageUri} : prev));
  };

  return (
    <CarContext.Provider value={{cars, selectedCar, addCar, removeCar, selectCar, updateCarImage}}>
      {children}
    </CarContext.Provider>
  );
};
