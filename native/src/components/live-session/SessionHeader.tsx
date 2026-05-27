/**
 * Smart Campus Presence — SessionHeader (Live Session)
 *
 * Displays course code (large cyan), course name, optional topic,
 * lecturer name and formatted session date.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/theme/colors';
import { SessionWithDetails } from '@/types';

interface SessionHeaderProps {
  session: SessionWithDetails | null;
}

function formatSessionDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionHeader({ session }: SessionHeaderProps) {
  if (!session) return null;

  const courseCode = session.courses?.code ?? '—';
  const courseName = session.courses?.name ?? 'Unknown Course';
  const lecturerName = session.lecturer?.full_name ?? '';
  const dateLabel = formatSessionDate(
    (session as any).started_at ?? (session as any).created_at,
  );

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Course code — large cyan */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: '900',
          color: Colors.accent,
          letterSpacing: -0.5,
          marginBottom: 2,
        }}
      >
        {courseCode}
      </Text>

      {/* Course name */}
      <Text
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: Colors.foreground,
          marginBottom: 6,
          letterSpacing: 0.1,
        }}
      >
        {courseName}
      </Text>

      {/* Topic (optional) */}
      {(session as any).topic ? (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: Colors.mutedForeground,
            fontStyle: 'italic',
            marginBottom: 4,
          }}
        >
          {(session as any).topic}
        </Text>
      ) : null}

      {/* Lecturer · Date */}
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: Colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          opacity: 0.7,
        }}
      >
        {lecturerName ? `${lecturerName}  ·  ` : ''}
        {dateLabel}
      </Text>
    </View>
  );
}
