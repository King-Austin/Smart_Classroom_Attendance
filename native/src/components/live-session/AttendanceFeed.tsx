/**
 * Smart Campus Presence — AttendanceFeed (Live Session)
 *
 * FlatList of student check-ins. Each row shows:
 *   • Avatar circle (initials fallback)
 *   • Student name + reg_number
 *   • Status badge (verified=green / failed=red / manual=yellow)
 *   • Relative timestamp ("2m ago")
 *
 * Props: { records: AttendanceRecordWithProfile[]; isEnded?: boolean }
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import { Colors } from '@/theme/colors';
import { AttendanceRecordWithProfile } from '@/types';
import { ATTENDANCE_STATUS } from '@/constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type StatusKey = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

interface BadgeConfig {
  label: string;
  bg: string;
  border: string;
  text: string;
  bar: string;
}

function getBadge(status: string | null | undefined): BadgeConfig {
  switch (status) {
    case ATTENDANCE_STATUS.VERIFIED:
      return {
        label: 'Verified',
        bg: 'rgba(36,176,117,0.12)',
        border: 'rgba(36,176,117,0.30)',
        text: Colors.success,
        bar: Colors.success,
      };
    case ATTENDANCE_STATUS.FAILED:
      return {
        label: 'Failed',
        bg: 'rgba(239,68,68,0.10)',
        border: 'rgba(239,68,68,0.28)',
        text: Colors.destructive,
        bar: Colors.destructive,
      };
    case ATTENDANCE_STATUS.MANUAL:
      return {
        label: 'Manual',
        bg: 'rgba(245,158,11,0.10)',
        border: 'rgba(245,158,11,0.28)',
        text: Colors.warning,
        bar: Colors.warning,
      };
    default:
      return {
        label: 'Pending',
        bg: Colors.muted,
        border: Colors.border,
        text: Colors.mutedForeground,
        bar: Colors.mutedForeground,
      };
  }
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

interface RowProps {
  record: AttendanceRecordWithProfile;
}

const FeedRow = React.memo(function FeedRow({ record }: RowProps) {
  const badge = getBadge(record.status);
  const initials = getInitials(record.profiles?.full_name);
  const name = record.profiles?.full_name ?? 'Unknown Student';
  const regNo = record.profiles?.reg_number ?? 'REG/—';
  const time = relativeTime(record.created_at);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      {/* Left colour bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: badge.bar,
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
        }}
      />

      {/* Avatar circle */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: Colors.muted,
          borderWidth: 1,
          borderColor: Colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: 6,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '800',
            color: Colors.accent,
            letterSpacing: 0.5,
          }}
        >
          {initials}
        </Text>
      </View>

      {/* Name + reg */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: Colors.foreground,
            marginBottom: 3,
          }}
        >
          {name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: Colors.mutedForeground,
              textTransform: 'uppercase',
              letterSpacing: 1,
              opacity: 0.65,
            }}
          >
            {regNo}
          </Text>
          <View
            style={{
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: Colors.border,
            }}
          />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: Colors.mutedForeground,
              fontStyle: 'italic',
              opacity: 0.45,
            }}
          >
            {time}
          </Text>
        </View>
      </View>

      {/* Status badge */}
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: badge.bg,
          borderWidth: 1,
          borderColor: badge.border,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: '800',
            color: badge.text,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {badge.label}
        </Text>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface AttendanceFeedProps {
  records: AttendanceRecordWithProfile[];
  isEnded?: boolean;
}

export function AttendanceFeed({ records, isEnded = false }: AttendanceFeedProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AttendanceRecordWithProfile>) => (
      <FeedRow record={item} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: AttendanceRecordWithProfile) => item.id,
    [],
  );

  const Empty = (
    <View
      style={{
        paddingVertical: 48,
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Colors.border,
        backgroundColor: 'rgba(20,20,28,0.4)',
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '800',
          color: Colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 2,
          opacity: 0.45,
        }}
      >
        Awaiting Signal...
      </Text>
    </View>
  );

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '800',
            color: Colors.mutedForeground,
            textTransform: 'uppercase',
            letterSpacing: 2,
            opacity: 0.7,
          }}
        >
          {isEnded ? 'Final Attendance Journal' : 'Real-time Feed'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: isEnded
                ? Colors.mutedForeground
                : Colors.accent,
              opacity: isEnded ? 0.35 : 1,
            }}
          />
          <Text
            style={{
              fontSize: 9,
              fontWeight: '800',
              color: Colors.mutedForeground,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              opacity: 0.5,
            }}
          >
            {isEnded ? 'Logged' : 'Live Sync'}
          </Text>
        </View>
      </View>

      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={Empty}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
