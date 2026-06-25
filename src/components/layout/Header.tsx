'use client'

import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'

interface HeaderProps {
  title: string
  showBack?: boolean
  backHref?: string
  showLogout?: boolean
  rightAction?: React.ReactNode
}

export default function Header({
  title,
  showBack = false,
  showLogout = false,
  backHref,
  rightAction,          // ← adicionar aqui
}: HeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) router.push(backHref)
    else router.back()
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="h-16 px-4 flex items-center">

        {/* VOLTAR */}
        {showBack && (
          <button
            onClick={handleBack}
            className="mr-3 px-4 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
          >
            ← Voltar
          </button>
        )}

        {/* LOGO */}
        {!showBack && (
          <div className="w-9 h-9 rounded-xl bg-[#1a2744] text-white flex items-center justify-center mr-3 font-bold">
          </div>
        )}

        {/* TÍTULO */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base center font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>

        {/* DIREITA: rightAction + Sair */}
        <div className="flex items-center gap-2">
          {rightAction}
          {showLogout && (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-500 hover:text-gray-900 transition-colors"
            >
              Sair
            </button>
          )}
        </div>

      </div>
    </header>
  )
}