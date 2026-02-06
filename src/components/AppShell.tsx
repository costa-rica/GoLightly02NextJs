"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ModalLogin from '@/components/modals/ModalLogin'
import ModalRegister from '@/components/modals/ModalRegister'
import LoadingOverlay from '@/components/LoadingOverlay'

type AppShellProps = {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const wantsLogin = searchParams.get('login') === '1'
    const wantsRegister = searchParams.get('register') === '1'

    if (wantsLogin) {
      setIsRegisterOpen(false)
      setIsLoginOpen(true)
    }

    if (wantsRegister) {
      setIsLoginOpen(false)
      setIsRegisterOpen(true)
    }
  }, [searchParams])

  return (
    <>
      <Navigation onLoginClick={() => setIsLoginOpen(true)} />
      <div className="pt-16">{children}</div>
      <ModalLogin
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false)
          setIsRegisterOpen(true)
        }}
        onSwitchToForgotPassword={() => {
          setIsLoginOpen(false)
          router.push('/forgot-password')
        }}
      />
      <ModalRegister
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false)
          setIsLoginOpen(true)
        }}
      />
      <LoadingOverlay />
    </>
  )
}
