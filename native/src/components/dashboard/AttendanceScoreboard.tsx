/**
 * AttendanceScoreboard — Native port of src/components/dashboard/AttendanceScoreboard.tsx
 *
 * Shows overall attendance percentage ring + per-course breakdown.
 * Reanimated drives the ring stroke-dashoffset on mount.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseBreakdown {
  id: string;
  code: string;
  name: string;
  total: number;
  attended: number;
  percentage: number;
}

export interface AttendanceScoreboardProps {
  progress: number;         // 0-100
  attended: number;
  total: number;
  ranking?: string;
  courseBreakdown?: CourseBreakdown[];
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SVG_SIZE = 130;
const CENTER = SVG_SIZE / 2;

// ---------------------------------------------------------------------------
// Animated SVG circle wrapper
// ---------------------------------------------------------------------------

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({ progress }: { progress: number }) {
  const dashOffset = useSharedValue(RING_CIRCUMFERENCE);

  useEffect(() => {
    const target = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * progress) / 100;
    dashOffset.value = withTiming(target, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  return (
    <Svg width={SVG_SIZE} height={SVG_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* Track ring */}
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        stroke={Colors.muted}
        strokeWidth={10}
        fill="transparent"
        opacity={0.4}
      />
      {/* Progress ring */}
      <AnimatedCircle
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        stroke={Colors.accent}
        strokeWidth={10}
        strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
        animatedProps={animatedProps}
        strokeLinecap="round"
        fill="transparent"
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Course progress bar row
// ---------------------------------------------------------------------------

function CourseRow({ course }: { course: CourseBreakdown }) {
  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(course.percentage, {
      duration: 1000,
      easing: Easing.out(Easing.ease),
    });
  }, [course.percentage]);

  const animatedBarStyle = {
    width: `${course.percentage}%` as `${number}%`,
  };

  return (
    <View style={styles.courseRow}>
      <View style={styles.courseRowHeader}>
        <Text style={styles.courseCode} numberOfLines={1}>
          {course.code}
        </Text>
        <Text style={styles.coursePercent}>{course.percentage}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            animatedBarStyle,
            course.percentage < 75 && styles.progressFillWarn,
          ]}
        />
      </View>
      <Text style={styles.courseSubLabel}>
        {course.attended}/{course.total} sessions
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AttendanceScoreboard({
  progress,
  attended,
  total,
  ranking,
  courseBreakdown = [],
  loading,
}: AttendanceScoreboardProps) {
  if (loading) {
    return <View style={styles.skeleton} />;
  }

  const rankingText =
    ranking ??
    (progress >= 95
      ? 'Top 5% of class'
      : progress >= 85
      ? 'Top 15% of class'
      : progress >= 70
      ? 'Top 30% of class'
      : progress >= 50
      ? 'Top 50% of class'
      : 'Keep going for top 50%!');

  return (
    <View style={styles.card}>
      {/* Subtle glow accent */}
      <View style={styles.glowAccent} pointerEvents="none" />

      {/* Top row: ring + stat cards */}
      <View style={styles.topRow}>
        {/* Progress ring */}
        <View style={styles.ringContainer}>
          <ProgressRing progress={progress} />
          <View style={styles.ringLabel}>
            <Text style={styles.ringPercent}>{progress}%</Text>
            <Text style={styles.ringSubLabel}>SCORE</Text>
          </View>
        </View>

        {/* Stat cells */}
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statIcon}>✓</Text>
            <Text style={styles.statLabel}>ATTENDED</Text>
            <Text style={styles.statValue}>{attended}</Text>
            <Text style={styles.statSub}>Sessions confirmed</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statSub}>Active sessions</Text>
          </View>
        </View>
      </View>

      {/* Ranking row */}
      <View style={styles.rankingRow}>
        <View style={styles.rankingIcon}>
          <Text style={styles.rankingIconText}>🏆</Text>
        </View>
        <View style={styles.rankingTextBlock}>
          <Text style={styles.rankingTitle}>Academic Ranking</Text>
          <Text style={styles.rankingValue}>{rankingText}</Text>
        </View>
        <Text style={styles.rankingChevron}>↗</Text>
      </View>

      {/* Per-course breakdown */}
      {courseBreakdown.length > 0 && (
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>COURSE BREAKDOWN</Text>
          {courseBreakdown.map((course) => (
            <CourseRow key={course.id} course={course} />
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  skeleton: {
    height: 190,
    borderRadius: 24,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    opacity: 0.5,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  glowAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent,
    opacity: 0.06,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  ringContainer: {
    width: SVG_SIZE,
    height: SVG_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    color: Colors.foreground,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  ringSubLabel: {
    color: Colors.mutedForeground,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statsGrid: {
    flex: 1,
    gap: 10,
  },
  statCell: {
    backgroundColor: `${Colors.muted}99`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.border}80`,
    padding: 10,
  },
  statIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  statLabel: {
    color: Colors.mutedForeground,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  statValue: {
    color: Colors.foreground,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statSub: {
    color: Colors.mutedForeground,
    fontSize: 9,
    marginTop: 2,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.accent}0D`,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginBottom: 0,
  },
  rankingIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: `${Colors.accent}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingIconText: {
    fontSize: 16,
  },
  rankingTextBlock: {
    flex: 1,
  },
  rankingTitle: {
    color: Colors.foreground,
    fontSize: 13,
    fontWeight: '700',
  },
  rankingValue: {
    color: Colors.mutedForeground,
    fontSize: 11,
    marginTop: 1,
  },
  rankingChevron: {
    color: `${Colors.accent}80`,
    fontSize: 16,
    fontWeight: '700',
  },
  breakdownSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  breakdownTitle: {
    color: Colors.mutedForeground,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  courseRow: {
    marginBottom: 14,
  },
  courseRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseCode: {
    color: Colors.foreground,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
    marginRight: 8,
  },
  coursePercent: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 5,
    backgroundColor: Colors.muted,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  progressFillWarn: {
    backgroundColor: Colors.warning,
  },
  courseSubLabel: {
    color: Colors.mutedForeground,
    fontSize: 9,
    fontWeight: '500',
  },
});
