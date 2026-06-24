'use client'

import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'

interface HeaderProps {
  title: string
  showBack?: boolean
  showLogout?: boolean
  backHref?: string
}

export default function Header({
  title,
  showBack = false,
  showLogout = false,
  backHref,
}: HeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
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
            className="
              mr-3
              w-9
              h-9
              rounded-xl
              hover:bg-gray-100
              flex
              items-center
              justify-center
              transition-colors
            "
            aria-label="Voltar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-700"
            >
              <path d="M19 12H5" />
              <path d="M12 5L5 12L12 19" />
            </svg>
          </button>
        )}

        {/* LOGO */}
        {!showBack && (
          <div
            className="
              w-9
              h-9
              rounded-xl
              bg-[#1a2744]
              text-white
              flex
              items-center
              justify-center
              mr-3
              font-bold
            "
          >
            
          </div>
        )}

        {/* TÍTULO */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>

        {/* SAIR */}
        {showLogout && (
          <button
            onClick={handleLogout}
            className="
              text-sm
              font-medium
              text-gray-500
              hover:text-gray-900
              transition-colors
            "
          >
            Sair
          </button>
        )}

      </div>

    </header>
  )
}