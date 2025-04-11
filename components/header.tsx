"use client"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { usePathname } from "next/navigation"

export function Header() {
  const pathname = usePathname()

  // 로그인/회원가입 페이지에서는 다른 헤더를 사용하므로 제외
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/"

  if (isAuthPage) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-x-8">
            <h1 className="text-xl font-bold text-blue-700">동아리 출석 체크</h1>
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
