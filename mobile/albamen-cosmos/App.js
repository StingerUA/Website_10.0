import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

const GAME_URL = 'https://albaspace.com.tr/games/albamen-cosmos/?lang=tr';

const INTERNAL_HOSTS = new Set([
  'albaspace.com.tr',
  'www.albaspace.com.tr',
  'api.albaspace.com.tr',
  'accounts.google.com',
]);

function isInternalUrl(rawUrl) {
  if (!rawUrl || rawUrl === 'about:blank') return true;

  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' && INTERNAL_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const retry = () => {
    setFailed(false);
    setReloadKey((value) => value + 1);
  };

  const handleNavigationRequest = (request) => {
    const { url } = request;

    if (isInternalUrl(url)) return true;

    if (/^https?:\/\//i.test(url)) {
      Linking.openURL(url).catch(() => {});
    }

    return false;
  };

  if (failed) {
    return (
      <View style={styles.errorScreen}>
        <StatusBar style="light" />
        <Text style={styles.logo}>ALBAMEN</Text>
        <Text style={styles.title}>Cosmos</Text>
        <Text style={styles.errorText}>
          İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edip tekrar deneyin.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry} activeOpacity={0.85}>
          <Text style={styles.retryButtonText}>TEKRAR DENE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <WebView
        key={reloadKey}
        ref={webViewRef}
        source={{ uri: GAME_URL }}
        style={styles.webView}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        startInLoadingState
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures
        mixedContentMode="never"
        originWhitelist={['https://*']}
        onShouldStartLoadWithRequest={handleNavigationRequest}
        onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
        onError={() => setFailed(true)}
        renderLoading={() => (
          <View style={styles.loadingScreen}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingBrand}>ALBAMEN COSMOS</Text>
            <Text style={styles.loadingText}>Yükleniyor…</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07091A',
  },
  webView: {
    flex: 1,
    backgroundColor: '#07091A',
  },
  loadingScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#07091A',
    gap: 12,
  },
  loadingBrand: {
    marginTop: 16,
    color: '#F0F4FF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  loadingText: {
    color: '#AAB2CF',
    fontSize: 14,
  },
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#07091A',
  },
  logo: {
    color: '#F0F4FF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 3,
  },
  title: {
    marginTop: 2,
    color: '#7C8CFF',
    fontSize: 22,
    fontWeight: '700',
  },
  errorText: {
    maxWidth: 420,
    marginTop: 28,
    color: '#C4CAE0',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  retryButtonText: {
    color: '#07091A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
});
