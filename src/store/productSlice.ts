import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, ProductsResponse } from '../types';

interface ProductState {
  items: Product[];
  total: number;
  skip: number;
  limit: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  searchQuery: string;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: ProductState = {
  items: [],
  total: 0,
  skip: 0,
  limit: 20,
  status: 'idle',
  searchQuery: '',
  error: null,
  lastUpdated: null,
};

// Fetch products thunk
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ skip, limit, query, refresh = false }: { skip: number; limit: number; query: string; refresh?: boolean }, { rejectWithValue }) => {
    try {
      const url = query
        ? `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}&limit=${limit}&skip=${skip}`
        : `https://dummyjson.com/products?limit=${limit}&skip=${skip}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data: ProductsResponse = await response.json();
      return { data, refresh };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    resetProducts: (state) => {
      state.items = [];
      state.skip = 0;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.lastUpdated = Date.now();
        
        if (action.payload.refresh) {
          state.items = action.payload.data.products;
        } else {
          // Append new products and ensure no duplicates
          const newProducts = action.payload.data.products.filter(
            (p) => !state.items.find((item) => item.id === p.id)
          );
          state.items = [...state.items, ...newProducts];
        }
        
        state.total = action.payload.data.total;
        state.skip = action.payload.data.skip;
        state.limit = action.payload.data.limit;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { setSearchQuery, resetProducts } = productSlice.actions;
export default productSlice.reducer;
