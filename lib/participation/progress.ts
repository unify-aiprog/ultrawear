export interface FanProgress { level: number; xp: number; streak: number; participations: number; badges: string[]; }
export function createFanProgress(): FanProgress { return { level: 1, xp: 0, streak: 0, participations: 0, badges: [] }; }
