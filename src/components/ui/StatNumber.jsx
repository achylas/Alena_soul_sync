import { useEffect, useRef, useState } from 'react'

export default function StatNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const reduced = localStorage.getItem('mh_motion') === 'reduced'
    if (reduced) {
      setDisplay(value ?? 0)
      prev.current = value ?? 0
      return
    }
    const start = prev.current
    const end = value ?? 0
    const diff = end - start
    const startTime = performance.now()
    let raf = 0
    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      setDisplay(Math.round(start + diff * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    prev.current = end
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <div className="score">{display}</div>
}
