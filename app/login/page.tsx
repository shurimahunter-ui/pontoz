import { login } from '@/app/actions/auth'
import Logo from '@/components/Logo'

export const instant = false

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <main className="shell flex flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-3"><Logo size={44} /><h1>Ponto</h1></div>
      <form action={login} className="space-y-4">
        {error && <p role="alert" className="err">E-mail ou senha incorretos.</p>}
        <label className="label">E-mail
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
        <label className="label">Senha
          <input name="password" type="password" required autoComplete="current-password" className="field" />
        </label>
        <button className="btn">Entrar</button>
      </form>
    </main>
  )
}
