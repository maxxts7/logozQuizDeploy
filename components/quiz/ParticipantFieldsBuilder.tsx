"use client"

import { Button, Input, Checkbox } from "@/components/ui"

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
        <label className="text-sm font-medium text-slate-700">
          Participant Information Fields
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addField}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-3 px-4 bg-slate-50 rounded-lg">
          No fields configured. Participants can start the quiz immediately.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <Input
                type="text"
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Field label (e.g., Name, Email, Student ID)"
                className="flex-1 bg-white"
              />
              <Checkbox
                id={`field-required-${index}`}
                checked={field.required}
                onChange={(e) => updateField(index, { required: e.target.checked })}
                label="Required"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeField(index)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
