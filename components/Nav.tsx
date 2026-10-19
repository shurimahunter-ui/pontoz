'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [['/', 'Ponto'], ['/history', 'Histórico'], ['/profile', 'Perfil']] as const

export default function Nav() {
  const path = usePathname()
  return (
    <nav className="flex" aria-label="Principal">
      {items.map(([href, label]) => {
        const on = href === '/' ? path === '/' : path.startsWith(href)
        return (
          <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={`tab ${on ? 'tab-on' : ''}`}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
