export default function Skeleton({ width = '100%', height = 16, rounded = 12, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: rounded,
        ...style
      }}
    />
  )
}
