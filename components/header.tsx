"use client"
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Menu, Home, Users, QrCode, BarChart3 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  
  // 루트 페이지인지 확인
  const isRootPage = pathname === "/"

  // 네비게이션 아이템 정의
  const navItems = [
    {
      name: "대시보드",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "동아리",
      href: "/clubs",
      icon: Users,
    },
    {
      name: "출석 체크",
      href: "/attendance",
      icon: QrCode,
    },
    {
      name: "통계",
      href: "/statistics",
      icon: BarChart3,
    },
  ]

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

    // 로그인 상태 변화 감지
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  // 로그인/회원가입 페이지에서는 다른 헤더를 사용하므로 제외
  // 루트 페이지는 isAuthPage에서 제외 (루트 페이지에서도 헤더 표시)
  const isAuthPage = pathname === "/login" || pathname === "/signup" || 
                    pathname === "/forgot-password" || pathname === "/reset-password"

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
            {!isRootPage && (
              <div className="hidden md:block">
                <MainNav />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <UserNav />
            ) : (
              <div className="hidden sm:flex space-x-2">
                <Button variant="outline" asChild size="sm">
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">회원가입</Link>
                </Button>
              </div>
            )}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">메뉴 열기</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle className="text-left">동아리 출석 체크</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col space-y-3">
                    {isAuthenticated ? (
                      navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                          <Button
                            key={item.href}
                            asChild
                            variant={isActive ? "default" : "ghost"}
                            className={cn(
                              "justify-start w-full",
                              isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "hover:bg-blue-50",
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            <Link href={item.href} className="flex items-center">
                              <item.icon className="mr-2 h-4 w-4" />
                              {item.name}
                            </Link>
                          </Button>
                        )
                      })
                    ) : (
                      <>
                        {!isRootPage ? (
                          // 루트 페이지가 아닌 경우 메뉴 표시
                          navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                            return (
                              <Button
                                key={item.href}
                                variant="ghost"
                                className="justify-start w-full hover:bg-blue-50"
                                onClick={() => {
                                  setIsOpen(false)
                                  router.push("/login")
                                }}
                              >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.name}
                              </Button>
                            )
                          })
                        ) : null}
                        <Button
                          variant="ghost"
                          className="justify-start w-full hover:bg-blue-50"
                          onClick={() => {
                            setIsOpen(false)
                            router.push("/login")
                          }}
                        >
                          로그인
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start w-full hover:bg-blue-50"
                          onClick={() => {
                            setIsOpen(false)
                            router.push("/signup")
                          }}
                        >
                          회원가입
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
