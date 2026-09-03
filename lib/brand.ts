export const brand = {
  name: 'UltraWear FC',
  moniker: 'For Community',
  colors: {
    communityNavy: '#1E2D4F',
    collectiveBlack: '#111111',
    unityBone: '#F4F0E6',
    fieldGreen: '#4F7652',
    matchdayCoral: '#C96642',
  },
} as const;

export const motion = {
  durationFast: '140ms',
  durationStandard: '220ms',
  durationSlow: '420ms',
  easeStandard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  easeEnter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeExit: 'cubic-bezier(0.7, 0, 0.84, 0)',
} as const;
