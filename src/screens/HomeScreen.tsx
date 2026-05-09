import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootState, AppDispatch } from '../store';
import { fetchProducts, setSearchQuery, resetProducts } from '../store/productSlice';
import { RootStackParamList } from '../navigation/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, status, skip, limit, total, searchQuery } = useSelector(
    (state: RootState) => state.products
  );

  const [refreshing, setRefreshing] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // AppState management
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to the foreground!
        console.log('App has come to the foreground!');
        // Could refresh data here if needed based on `lastUpdated` timestamp
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (debouncedQuery !== searchQuery) {
        dispatch(setSearchQuery(debouncedQuery));
        dispatch(resetProducts());
        dispatch(fetchProducts({ skip: 0, limit, query: debouncedQuery, refresh: true }));
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [debouncedQuery, dispatch, limit, searchQuery]);

  // Initial load
  useEffect(() => {
    if (items.length === 0 && status === 'idle' && !searchQuery) {
      dispatch(fetchProducts({ skip: 0, limit, query: '', refresh: true }));
    }
  }, [dispatch, items.length, status, limit, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    dispatch(resetProducts());
    await dispatch(fetchProducts({ skip: 0, limit, query: searchQuery, refresh: true }));
    setRefreshing(false);
  }, [dispatch, limit, searchQuery]);

  const loadMore = () => {
    if (status !== 'loading' && items.length < total) {
      dispatch(fetchProducts({ skip: skip + limit, limit, query: searchQuery, refresh: false }));
    }
  };

  const renderFooter = () => {
    if (status === 'loading' && items.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (status === 'loading' && items.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    }
    if (status !== 'loading' && items.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No products found.</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#888"
          value={debouncedQuery}
          onChangeText={setDebouncedQuery}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Detail', { product: item })}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.cardInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.brand}>{item.brand || item.category}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#eee',
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  rating: {
    fontSize: 14,
    color: '#f57c00',
    fontWeight: '600',
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen;
