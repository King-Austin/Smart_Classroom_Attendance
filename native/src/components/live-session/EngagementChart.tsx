/**
 * Smart Campus Presence — EngagementChart (Live Session)
 *
 * Renders a simple cumulative attendance line by bucketing records into
 * 5-minute intervals. Uses a lightweight SVG-based sparkline (no chart
 * library required — victory-native v41 needs Skia which adds substantial
 * native dependencies).
 *
 * Props: { records: AttendanceRecordWithProfile[] }
 */
import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Polyline, Line as SvgLine } from 'react-native-svg';
import { Colors } from '@/theme/colors';
import { AttendanceRecordWithProfile } from '@/types';

interface EngagementChartProps {
  records: AttendanceRecordWithProfile[];
}

const CHART_HEIGHT = 140;
const HORIZONTAL_PADDING = 32;

export const EngagementChart = ({ records }: EngagementChartProps) => {
  const points = useMemo(() => {
    if (records.length === 0) return [] as { x: number; y: number }[];

    const sorted = [...records].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const startTs = new Date(sorted[0].created_at).getTime();
    const endTs = new Date(sorted[sorted.length - 1].created_at).getTime();
    const spanMs = Math.max(endTs - startTs, 5 * 60_000);

    return sorted.map((r, i) => {
      const ts = new Date(r.created_at).getTime();
      return {
        x: (ts - startTs) / spanMs,
        y: (i + 1) / sorted.length,
      };
    });
  }, [records]);

  const width = Dimensions.get('window').width - HORIZONTAL_PADDING * 2;

  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: Colors.accent,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 12,
        }}
      >
        Engagement Over Time
      </Text>

      {points.length < 2 ? (
        <View style={{ height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.mutedForeground, fontSize: 11 }}>
            Waiting for attendance data…
          </Text>
        </View>
      ) : (
        <Svg width={width} height={CHART_HEIGHT}>
          {[0.25, 0.5, 0.75].map((t) => (
            <SvgLine
              key={t}
              x1={0}
              x2={width}
              y1={CHART_HEIGHT * t}
              y2={CHART_HEIGHT * t}
              stroke={Colors.border}
              strokeOpacity={0.4}
              strokeWidth={1}
              strokeDasharray="3,4"
            />
          ))}
          <Polyline
            points={points
              .map((p) => `${p.x * width},${CHART_HEIGHT - p.y * CHART_HEIGHT}`)
              .join(' ')}
            fill="none"
            stroke={Colors.accent}
            strokeWidth={2.5}
          />
        </Svg>
      )}
    </View>
  );
};
