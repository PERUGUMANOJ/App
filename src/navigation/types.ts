import { Product } from '../types';

export type RootStackParamList = {
  Home: undefined;
  Detail: { product: Product };
};
