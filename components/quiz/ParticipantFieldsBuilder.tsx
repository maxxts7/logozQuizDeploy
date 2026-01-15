"use client"

export interface ParticipantField {
  label: string
  required: boolean
}

interface ParticipantFieldsBuilderProps {
  fields: ParticipantField[]
  onChange: (fields: ParticipantField[]) => void
}

export default function ParticipantFieldsBuilder({ fields, onChange }: ParticipantFieldsBuilderProps) {
  const addField = () => {
    onChange([...fields, { label: "", required: false }])
  }

  const updateField = (index: number, updates: Partial<ParticipantField>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    onChange(newFields)
  }

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Participant Information Fields
        </label>
        <button
          type="button"
          onClick={addField}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          No fields configured. Participants can start the quiz immediately.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Field label (e.g., Name, Email, Student ID)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove field"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
