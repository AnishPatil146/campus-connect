import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Animated, Easing } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GraduationCap } from 'lucide-react-native';

export const AuthLoadingScreen: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.75)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth infinite pulse & rotation animation loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.75,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContainer}>
        {/* Animated Outer Glow Ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
            },
          ]}
        />

        {/* Centered Glowing Logo Badge */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <GraduationCap size={44} color={colors.textWhite} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 140,
    height: 140,
  },
  glowRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.6)',
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.student.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});
