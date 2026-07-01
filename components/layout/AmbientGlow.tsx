// components/layout/AmbientGlow.tsx — static, no rAF, pointer-events-none, aria-hidden
export function AmbientGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute -left-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-[var(--glow-cyan)] blur-[130px]" />
      <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-[var(--glow-violet)] blur-[130px]" />
      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--glow-fuchsia)] blur-[120px]" />
    </div>
  )
}
