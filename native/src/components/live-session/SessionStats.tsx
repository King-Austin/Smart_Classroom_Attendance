/**
 * Smart Campus Presence — SessionStats (Live Session)
 *
 * 2-column stat grid showing Present count (accented) and Total Enrolled.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/theme/colors';

interface SessionStatsProps {
  present: number;
  total: number;
  rate: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  sub: string;
  accent?: boolean;
}

function StatCard({ label, value, sub, accent = false }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        borderRadius: 16,
        backgroundColor: accent ? 'rgba(0,229,255,0.05)' : `${Colors.card}99`,
        borderWidth: 1,
        borderColor: accent ? 'rgba(0,229,255,0.20)' : Colors.border,
        overflow: 'hidden',
      }}
    >
      {/* Label */}
      <Text
        style={{
          fontSize: 9,
          fontWeight: '700',
          color: Colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 4,
          opacity: 0.7,
        }}
      >
        {label}
      </Text>

      {/* Value row */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: accent ? Colors.accent : Colors.foreground,
            letterSpacing: -0.5,
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            fontSize: 9,
            fontWeight: '700',
            color: Colors.mutedForeground,
            textTransform: 'uppercase',
            letterSpacing: 1,
            opacity: 0.55,
          }}
        >
          {sub}
        </Text>
      </View>

      {/* Accent bottom bar */}
      {accent && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: 'rgba(0,229,255,0.25)',
          }}
        />
      )}
    </View>
  );
}

export function SessionStats({ present, total, rate }: SessionStatsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
      }}
    >
      <StatCard label="Enrolled" value={total} sub="Students" accent={false} />
      <StatCard label="Present" value={present} sub={`${rate}% Rate`} accent />
    </View>
  );
}
