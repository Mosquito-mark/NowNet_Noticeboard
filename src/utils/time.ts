export function formatUptime(connectedAt: number | undefined): string {
  if (!connectedAt) return '0m';
  const diff = Date.now() - connectedAt;
  return formatDuration(Math.floor(diff / 1000));
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}
