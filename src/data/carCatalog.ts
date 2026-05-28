export const CAR_MAKES = [
  'Acura',
  'Audi',
  'BMW',
  'Chevrolet',
  'Dodge',
  'Ford',
  'Honda',
  'Hyundai',
  'Jeep',
  'Kia',
  'Lexus',
  'Mazda',
  'Mercedes-Benz',
  'Nissan',
  'Porsche',
  'Subaru',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
] as const;

export type CarMake = (typeof CAR_MAKES)[number];

export const CAR_MODELS: Record<CarMake, string[]> = {
  Acura: ['ILX', 'Integra', 'MDX', 'RDX', 'TLX'],
  Audi: ['A3', 'A4', 'A5', 'A6', 'Q5', 'Q7', 'RS3', 'S4', 'TT'],
  BMW: ['228i', '320i', '330i', '430i', '540i', 'M3', 'M4', 'X3', 'X5', 'Z4'],
  Chevrolet: ['Camaro', 'Colorado', 'Corvette', 'Malibu', 'Silverado', 'Tahoe'],
  Dodge: ['Challenger', 'Charger', 'Durango', 'Ram 1500'],
  Ford: ['Bronco', 'Escape', 'Explorer', 'F-150', 'Focus', 'Mustang', 'Ranger'],
  Honda: ['Accord', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Pilot', 'Type R'],
  Hyundai: ['Elantra', 'Ioniq 5', 'Kona', 'Santa Fe', 'Sonata', 'Tucson'],
  Jeep: ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Wrangler'],
  Kia: ['Forte', 'K5', 'Seltos', 'Sorento', 'Soul', 'Sportage', 'Stinger'],
  Lexus: ['ES', 'GX', 'IS', 'LC', 'NX', 'RX', 'UX'],
  Mazda: ['CX-30', 'CX-5', 'CX-9', 'Mazda3', 'Mazda6', 'MX-5 Miata'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'CLA', 'E-Class', 'GLC', 'GLE', 'S-Class'],
  Nissan: ['370Z', 'Altima', 'GT-R', 'Maxima', 'Rogue', 'Sentra', 'Z'],
  Porsche: ['718 Boxster', '911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Subaru: ['BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Outback', 'WRX'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y'],
  Toyota: ['4Runner', 'Camry', 'Corolla', 'GR86', 'Highlander', 'RAV4', 'Supra', 'Tacoma', 'Tundra'],
  Volkswagen: ['Golf', 'Golf GTI', 'Jetta', 'Passat', 'Tiguan'],
  Volvo: ['S60', 'S90', 'V60', 'XC40', 'XC60', 'XC90'],
};

export const buildYearOptions = (): number[] => {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= 1985; y -= 1) {
    years.push(y);
  }
  return years;
};

export const YEAR_OPTIONS = buildYearOptions();
