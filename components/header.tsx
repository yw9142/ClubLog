"use client"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('인증 상태 확인 오류:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  // 로그인/회원가입 페이지에서는 다른 헤더를 사용하므로 제외
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/"

  if (isAuthPage) {
    return null
  }

  // 타이틀 클릭 핸들러
  const handleTitleClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-x-8">
            <h1 
              onClick={handleTitleClick} 
              className="text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors cursor-pointer"
            >
              동아리 출석 체크
            </h1>
            <div className="hidden md:block">
              <MainNav />
            </div>
          </div>
          <div className="flex items-center">
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  )
}
