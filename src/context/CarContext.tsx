import React, {createContext, useContext, useState, useEffect} from 'react';
import type {Car} from '../types';
import {api} from '../services/api';

type CarContextType = {
  cars: Car[];
  selectedCar: Car | null;
  addCar: (car: Omit<Car, 'id'>) => Promise<void>;
  removeCar: (id: string) => Promise<void>;
  selectCar: (car: Car) => void;
};

const CarContext = createContext<CarContextType>({
  cars: [],
  selectedCar: null,
  addCar: async () => {},
  removeCar: async () => {},
  selectCar: () => {},
});

export const useCar = () => useContext(CarContext);

export const CarProvider = ({children}: {children: React.ReactNode}) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  useEffect(() => {
    api
      .get('/cars')
      .then((data: any[]) => {
        const loaded: Car[] = data.map(c => ({
          id: String(c.id),
          make: c.make,
          model: c.model,
          year: c.year,
          imageUri: c.image_uri || undefined,
        }));
        setCars(loaded);
        if (loaded.length > 0) {
          setSelectedCar(loaded[0]);
        }
      })
      .catch(() => {}); // backend unavailable — start with empty list
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
      }
    } catch {
      // backend unavailable — fall back to local-only with temp id
      const car: Car = {...carData, id: Date.now().toString()};
      setCars(prev => [...prev, car]);
      if (!selectedCar) {
        setSelectedCar(car);
      }
    }
  };

  const removeCar = async (id: string) => {
    try {
      await api.del(`/cars/${id}`);
    } catch {
      // proceed with local removal even if backend call fails
    }
    setCars(prev => prev.filter(c => c.id !== id));
    if (selectedCar?.id === id) {
      setSelectedCar(null);
    }
  };

  const selectCar = (car: Car) => setSelectedCar(car);

  return (
    <CarContext.Provider value={{cars, selectedCar, addCar, removeCar, selectCar}}>
      {children}
    </CarContext.Provider>
  );
};
