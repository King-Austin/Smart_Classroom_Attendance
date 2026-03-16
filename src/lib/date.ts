/**
 * Utility for date and time formatting.
 */

/**
 * Formats a date string or object into a short time string (e.g., "02:15 PM").
 */
export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats a date string or object into a human-readable date string (e.g., "Oct 24, 2023").
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Returns a relative time string (e.g., "2 mins ago", "Just now").
 * Simple implementation for the context of this app.
 */
export const getRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  
  return formatDate(d);
};

/**
 * Returns "Today" if the date is today, otherwise formats as date.
 */
export const formatSessionDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  if (d.toLocaleDateString() === today.toLocaleDateString()) {
    return "Today";
  }
  return formatDate(d);
};
