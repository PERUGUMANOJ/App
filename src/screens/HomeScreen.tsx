import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchProducts, setSearchQuery, resetProducts } from '../store/productSlice';
import { Product } from '../types';

interface Props {
  navigation: { navigate: (route: 'Detail', params: { product: Product }) => void };
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

const AnimatedCard = ({ item, index, onPress }: { item: Product, index: number, onPress: () => void }) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100 > 1000 ? 100 : index * 100, // stagger first 10 items
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: index * 100 > 1000 ? 100 : index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {item.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{Math.round(item.discountPercentage)}%</Text>
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.brand} numberOfLines={1}>{item.brand || item.category}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {item.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, status, skip, limit, total, searchQuery } = useSelector(
    (state: RootState) => state.products
  );

  const [refreshing, setRefreshing] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground!');
      }
    });
    return () => subscription.remove();
  }, []);

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

  const handleHomePress = () => {
    if (searchQuery || debouncedQuery) {
      setDebouncedQuery('');
      dispatch(setSearchQuery(''));
      dispatch(resetProducts());
      dispatch(fetchProducts({ skip: 0, limit, query: '', refresh: true }));
    }
  };

  const renderFooter = () => {
    if (status === 'loading' && items.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#e91e63" />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (status === 'loading' && items.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
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

  const categories = ['Electronics', 'Beauty', 'Home', 'Fashion', 'Sports', 'Toys'];

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {!searchQuery && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat, index) => (
              <TouchableOpacity key={index.toString()} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.sectionTitle}>Featured Products</Text>
        </>
      )}
      {!!searchQuery && (
        <Text style={styles.sectionTitle}>Search Results for "{searchQuery}"</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleHomePress} activeOpacity={0.7}>
          <Text style={styles.appTitle}>FreshShop</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, brands, categories..."
          placeholderTextColor="#888"
          value={debouncedQuery}
          onChangeText={setDebouncedQuery}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e91e63" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item, index }) => (
          <AnimatedCard 
            item={item} 
            index={index} 
            onPress={() => navigation.navigate('Detail', { product: item })} 
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e91e63',
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  listHeader: {
    paddingBottom: 8,
  },
  categoryScroll: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  categoryText: {
    color: '#495057',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e91e63',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardInfo: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 4,
    minHeight: 36, // To align rows if titles are 1 vs 2 lines
  },
  brand: {
    fontSize: 11,
    color: '#868e96',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2b8a3e',
  },
  ratingBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#f59f00',
    fontWeight: '700',
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
    color: '#868e96',
  },
});

export default HomeScreen;
