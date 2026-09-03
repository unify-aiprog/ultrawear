# UltraWear Visual Engine

The website's visual system uses four reference projects as implementation foundations:

- **Liquid Logo / Paper Design:** liquid-metal treatment for the UltraWear FC mark, implemented through Paper's `LiquidMetal` shader.
- **ShaderGradient:** the restrained animated 3D gradient atmosphere for hero surfaces.
- **LiquidGlassJS:** SVG-first liquid-glass refraction for readable UI surfaces, with a progressive fallback.
- **React Three Fiber:** declarative Three.js scenes for lightweight interactive 3D moments.

## Constitutional constraints

These effects are enhancement layers, not the product itself.

- One visual hierarchy per page; effects must not compete with content.
- `prefers-reduced-motion` receives a calmer/static treatment.
- GPU work is capped deliberately with low pixel density and restrained geometry.
- Interactive 3D must never carry essential information.
- The glass layer must preserve readable, selectable DOM content.
- Liquid-metal branding must remain recognizable as UltraWear FC.
- The system must degrade gracefully when WebGL is unavailable.
- Visual effects must never block navigation, accessibility, or core sports information.

## Current implementation

`components/ultra-visual-engine.tsx` composes the visual layers for the homepage. The component is client-only by design because all four technologies ultimately touch browser rendering APIs.
