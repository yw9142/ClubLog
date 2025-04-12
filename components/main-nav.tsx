"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { QrCode, BarChart3, Users, Home } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

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
    <nav className="flex items-center space-x-4 lg:space-x-6">
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
  )
}
