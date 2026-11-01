import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { errorMessage } from '../lib/client'
import { loginSchema } from '../api/schemas'
import type { LoginValues } from '../api/schemas'
import { LogIn } from 'lucide-react'
import { Button, Field, inputClass } from '../components/ui'

export function LoginPage() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (user) return <Navigate to="/admin" replace />

  const onSubmit = async (values: LoginValues) => {
    setError('')
    try {
      await signIn(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from ?? '/admin'
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-emerald-700">Food SG Admin</h1>
          <p className="text-sm text-slate-500">Đăng nhập để quản trị hệ thống</p>
        </div>

        <Field label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            className={inputClass}
            placeholder="admin@foodsg.vn"
          />
        </Field>

        <Field label="Mật khẩu" error={errors.password?.message}>
          <input
            {...register('password')}
            type="password"
            className={inputClass}
            placeholder="••••••••"
          />
        </Field>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          <LogIn size={18} />
          {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  )
}
