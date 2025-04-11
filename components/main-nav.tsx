"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { QrCode, BarChart3, Users, Home, Menu } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function MainNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

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

  return (
    <>
      {/* 모바일 메뉴 */}
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
              {navItems.map((item) => {
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
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 데스크톱 메뉴 */}
      <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "justify-start",
                isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "hover:bg-blue-50",
              )}
            >
              <Link href={item.href} className="flex items-center">
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          )
        })}
      </nav>
    </>
  )
}
