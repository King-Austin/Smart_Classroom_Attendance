/**
 * Smart Campus Presence — EngagementChart (Live Session)
 *
 * Groups attendance records into 5-minute buckets and renders a cumulative
 * VictoryArea chart (cyan fill + line) on a dark card background.
 *
 * Props: { records: AttendanceRecordWithProfile[] }
 */
import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import {
  VictoryChart,
  VictoryArea,
  VictoryAxis,
} from 'victory-native';
import { Colors } from '@/theme/colors';
import { AttendanceRecordWithProfile } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ChartPoint {
  x: string;
  y: number;
}

function buildChartData(records: AttendanceRecordWithProfile[]): ChartPoint[] {
  if (records.length === 0) return [];

  // Sort ascending by timestamp
  const sorted = [...records].sort(
    (a, b) =>
      new Date(a.created_at ?? 0).getTime() -
      new Date(b.created_at ?? 0).getTime(),
  );

  // Bucket into 5-minute intervals keyed by "HH:MM" (rounded down)
  const buckets = new Map<string, number>();
  for (const r of sorted) {
    const d = new Date(r.created_at ?? Date.now());
    const roundedMin = Math.floor(d.getMinutes() / 5) * 5;
    const key = `${String(d.getHours()).padStart(2, '0')}:${String(roundedMin).padStart(2, '0')}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  // Convert to cumulative data
  const points: ChartPoint[] = [];
  let cumulative = 0;
  for (const [x, count] of buckets.entries()) {
    cumulative += count;
    points.push({ x, y: cumulative });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EngagementChartProps {
  records: AttendanceRecordWithProfile[];
}

const CHART_WIDTH = Dimensions.get('window').width - 48; // 24px padding each side

export function EngagementChart({ records }: EngagementChartProps) {
  const data = useMemo(() => buildChartData(records), [records]);

  return (
    <View
      style={{
        borderRadius: 24,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
        paddingTop: 16,
        paddingBottom: 4,
        paddingHorizontal: 4,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Text
        style={{
          fontSize: 10,
          fontWeight: '800',
          color: Colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 2,
          opacity: 0.75,
          marginBottom: 4,
          paddingHorizontal: 12,
        }}
      >
        Attendance Trend
      </Text>

      {data.length < 2 ? (
        /* Not enough data yet */
        <View
          style={{
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: Colors.mutedForeground,
              opacity: 0.45,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            {records.length === 0 ? 'No data yet' : 'Collecting data…'}
          </Text>
        </View>
      ) : (
        <VictoryChart
          width={CHART_WIDTH}
          height={140}
          padding={{ top: 10, bottom: 30, left: 36, right: 16 }}
        >
          <VictoryAxis
            style={{
              axis: { stroke: Colors.border },
              tickLabels: {
                fontSize: 8,
                fill: Colors.mutedForeground,
                fontWeight: '600' as any,
              },
              grid: { stroke: 'transparent' },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: Colors.border },
              tickLabels: {
                fontSize: 8,
                fill: Colors.mutedForeground,
                fontWeight: '600' as any,
              },
              grid: {
                stroke: Colors.border,
                strokeDasharray: '4,4',
                opacity: 0.5,
              },
            }}
            tickFormat={(t: number) => Math.round(t).toString()}
          />
          <VictoryArea
            data={data}
            interpolation="monotoneX"
            style={{
              data: {
                fill: 'rgba(0,229,255,0.12)',
                stroke: Colors.accent,
                strokeWidth: 2,
              },
            }}
          />
        </VictoryChart>
      )}
    </View>
  );
}
