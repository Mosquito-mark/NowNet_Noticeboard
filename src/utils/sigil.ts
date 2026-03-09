export function generateSigil(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const chars = ['#', '.', '*', '+', 'o', 'x', '@', '%', '&', '!', '?', '>', '<', '=', '|', ':'];
  const sigil = [
    chars[Math.abs(hash) % chars.length],
    chars[Math.abs(hash >> 4) % chars.length],
    chars[Math.abs(hash >> 8) % chars.length],
    chars[Math.abs(hash >> 12) % chars.length]
  ];
  
  return `[${sigil[0]}${sigil[1]}${sigil[2]}${sigil[3]}]`;
}
