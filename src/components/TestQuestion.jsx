export default function TestQuestion({ index, text, options, value, onChange }) {
  return (
    <div className="qa-item">
      <div className="q">{index + 1}. {text}</div>
      <div className="a">
        {options.map(opt => (
          <label key={opt.value} className={value === opt.value ? 'option selected' : 'option'}>
            <span className="control" aria-hidden="true" />
            <span className="option-label">{opt.label}</span>
            <input
              type="radio"
              name={`q${index}`}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
          </label>
        ))}
      </div>
    </div>
  )
}
