import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import { Product } from '../types';

export type Route = { name: 'Home' } | { name: 'Detail'; product: Product };

const AppNavigator = () => {
  const [routeStack, setRouteStack] = useState<Route[]>([{ name: 'Home' }]);

  const navigate = useCallback((routeName: 'Detail', params: { product: Product }) => {
    setRouteStack((prev) => [...prev, { name: routeName, ...params }]);
  }, []);

  const goBack = useCallback(() => {
    setRouteStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const currentRoute = routeStack[routeStack.length - 1];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {currentRoute.name === 'Home' && (
        <HomeScreen navigation={{ navigate }} />
      )}
      {currentRoute.name === 'Detail' && (
        <DetailScreen route={{ params: { product: currentRoute.product } }} navigation={{ goBack }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});

export default AppNavigator;
