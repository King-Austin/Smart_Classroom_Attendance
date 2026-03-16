/**
 * Utility for attendance-related logic and formatting.
 */

/**
 * Maps attendance status to user-friendly labels.
 */
export const getAttendanceStatusLabel = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'verified': return 'Verified';
    case 'manual': return 'Manual';
    case 'failed': return 'Failed';
    default: return status || 'Unknown';
  }
};

/**
 * Maps attendance method (manual/automatic) to label.
 */
export const getAttendanceMethod = (isManual: boolean): string => {
  return isManual ? "Manual" : "Auto";
};

/**
 * Returns a CSS class or color variant for status badges.
 */
export const getAttendanceStatusVariant = (status: string): "success" | "warning" | "destructive" | "default" => {
  switch (status?.toLowerCase()) {
    case 'verified':
    case 'manual':
      return 'success';
    case 'failed':
      return 'destructive';
    default:
      return 'default';
  }
};
