import type { FieldPath, FieldValues, UseFormRegister } from 'react-hook-form'
import { Field, inputClass } from './ui'

interface FieldProps<T extends FieldValues> {
  register: UseFormRegister<T>
  name: FieldPath<T>
  label: string
  error?: string
}

interface TextFieldProps<T extends FieldValues> extends FieldProps<T> {
  type?: 'text' | 'number' | 'email' | 'password' | 'datetime-local'
  placeholder?: string
  /** Nếu có options thì hiển thị select, không thì hiển thị input */
  options?: { value: string; label: string }[]
}

/** Ô nhập (text/number/...) hoặc select, dùng chung cho mọi form. */
export function TextField<T extends FieldValues>({
  register,
  name,
  label,
  error,
  type = 'text',
  placeholder,
  options,
}: TextFieldProps<T>) {
  return (
    <Field label={label} error={error}>
      {options ? (
        <select {...register(name)} className={inputClass}>
          <option value="">{placeholder ?? 'Chọn'}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...register(name)}
          type={type}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </Field>
  )
}

/** Ô nhập nhiều dòng. */
export function TextAreaField<T extends FieldValues>({
  register,
  name,
  label,
  error,
  rows = 3,
}: FieldProps<T> & { rows?: number }) {
  return (
    <Field label={label} error={error}>
      <textarea {...register(name)} rows={rows} className={inputClass} />
    </Field>
  )
}
