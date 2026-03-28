import { set, unset } from 'sanity'

export function LocationPickerInput(props) {
  const { value, onChange, readOnly } = props

  const containerStyle = { display: 'flex', flexDirection: 'column', gap: 6 }
  const inputStyle = {
    width: '100%', padding: '8px 10px',
    border: '1px solid var(--card-border-color, #e0e0e0)',
    borderRadius: 3, fontSize: 14, color: '#111',
    backgroundColor: readOnly ? 'var(--card-bg-color, #f5f5f5)' : 'white',
  }
  const coordStyle = { fontSize: 11, color: '#888', fontFamily: 'monospace' }
  const hintStyle = { fontSize: 11, color: '#aaa' }

  const handleName = (e) => {
    const name = e.target.value
    if (!name) {
      onChange(unset())
    } else {
      onChange(set({ ...(value || {}), name }))
    }
  }

  const handleCoord = (field) => (e) => {
    const num = parseFloat(e.target.value)
    onChange(set({ ...(value || {}), [field]: isNaN(num) ? undefined : num }))
  }

  return (
    <div style={containerStyle}>
      <input
        type="text"
        placeholder="Plus code or area name — e.g. VHQ2+FH Bengaluru"
        value={value?.name || ''}
        onChange={handleName}
        readOnly={readOnly}
        style={inputStyle}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          step="any"
          placeholder="Latitude (optional)"
          value={value?.lat ?? ''}
          onChange={handleCoord('lat')}
          readOnly={readOnly}
          style={{ ...inputStyle, flex: 1 }}
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude (optional)"
          value={value?.lng ?? ''}
          onChange={handleCoord('lng')}
          readOnly={readOnly}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
      <span style={hintStyle}>Lat/lng is optional — only used for distance filtering in the portal</span>
      {value?.lat != null && value?.lng != null && (
        <span style={coordStyle}>📍 {value.lat.toFixed(5)}, {value.lng.toFixed(5)}</span>
      )}
    </div>
  )
}
