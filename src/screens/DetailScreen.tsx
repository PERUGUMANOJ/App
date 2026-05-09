import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

const { width } = Dimensions.get('window');

const DetailScreen: React.FC<Props> = ({ route }) => {
  const { product } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Image */}
        <Image
          source={{ uri: product.thumbnail }}
          style={styles.mainImage}
          resizeMode="cover"
        />

        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.brand}>{product.brand || product.category}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {product.rating}</Text>
            </View>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price}</Text>
            {product.discountPercentage > 0 && (
              <Text style={styles.discount}>
                {product.discountPercentage}% OFF
              </Text>
            )}
          </View>

          <Text style={styles.stockStatus}>
            {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* More Images */}
          {product.images && product.images.length > 1 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {product.images.map((img, index) => (
                  <Image
                    key={index.toString()}
                    source={{ uri: img }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainImage: {
    width: width,
    height: width * 0.8,
    backgroundColor: '#f9f9f9',
  },
  detailsContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    backgroundColor: '#fff8e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#f57c00',
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
    marginRight: 12,
  },
  discount: {
    fontSize: 14,
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stockStatus: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
});

export default DetailScreen;
