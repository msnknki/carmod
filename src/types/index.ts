export type RootTabParamList = {
  Home: undefined;
  DIY: undefined;
  Customization: undefined;
  AI: undefined;
};

export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  imageUri?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  userId: string;
  carId: string;
  type: 'chat' | 'diy';
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Part = {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  purchaseUrl: string;
  condition: string;
  source: 'ebay' | 'aliexpress';
  sellerLocation?: string;
};

export type Shop = {
  name: string;
  address: string;
  rating: number;
  phoneNumber: string;
  distance: string;
  mapsUrl: string;
};

export type ModificationProject = {
  id: string;
  carId: string;
  userId: string;
  description: string;
  generatedImageUrl?: string;
  totalEstimatedCost?: number;
  status: 'draft' | 'done';
  createdAt: string;
};
