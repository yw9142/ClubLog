"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { LogOut, Settings, User, Loader2 } from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import { signOut } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function UserNav() {
  const router = useRouter()
  const { profile, loading, clearProfile } = useUserProfile()
  const { toast } = useToast()

  // 기본 프로필 (로딩 중이거나 프로필이 없을 때 사용)
  const defaultProfile = {
    full_name: "사용자",
    email: "",
    userId: "",
    avatar_url: "/placeholder-user.jpg",
  }

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      
      if (error) {
        throw error
      }
      
      // 로컬 스토리지에서 프로필 정보 제거
      clearProfile()
      
      toast({
        title: "로그아웃 성공",
        description: "로그인 페이지로 이동합니다.",
      })
      
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error('로그아웃 오류:', error)
      toast({
        title: "로그아웃 실패",
        description: "다시 시도해주세요.",
        variant: "destructive"
      })
    }
  }

  // 이름에서 첫 글자 추출 (아바타 대체 텍스트용)
  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || defaultProfile.avatar_url} alt={profile?.full_name || defaultProfile.full_name} />
              <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
            </Avatar>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.full_name || defaultProfile.full_name}</p>
                <p className="text-xs leading-none text-muted-foreground">{profile?.email || defaultProfile.email}</p>
                {profile?.userId && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.userId}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>내 프로필</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>설정</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>로그아웃</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
