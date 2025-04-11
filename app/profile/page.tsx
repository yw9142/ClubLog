"use client"

import type React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  email: string
  full_name: string
  school: string
  department: string
}

export default function ProfilePage() {
  const { toast } = useToast()
  const router = useRouter()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // 사용자 정보 가져오기
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsPageLoading(true)
        
        // 현재 인증된 사용자 가져오기
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          console.error("로그인되지 않은 사용자")
          router.push("/login")
          return
        }
        
        // 프로필 정보 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (profileError) {
          console.error("프로필 정보 조회 오류:", profileError)
          throw profileError
        }
        
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: profileData.full_name || '',
          school: profileData.school || '',
          department: profileData.department || '',
        })
        
      } catch (error: any) {
        toast({
          title: "프로필 정보 로딩 실패",
          description: error.message || "사용자 정보를 불러오는 도중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsPageLoading(false)
      }
    }
    
    fetchUserProfile()
  }, [router, toast])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsLoading(true)

    try {
      // 프로필 업데이트
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: user.full_name,
          school: user.school,
          department: user.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (error) {
        console.error("프로필 업데이트 오류:", error)
        throw error
      }

      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      })
    } catch (error: any) {
      toast({
        title: "프로필 업데이트 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 현재 비밀번호 확인 및 새 비밀번호로 변경
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error("비밀번호 변경 오류:", error)
        throw error
      }

      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message || "현재 비밀번호가 올바르지 않거나 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 로딩 중이면 로딩 UI 표시
  if (isPageLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  // 사용자 정보가 없으면 오류 메시지 표시
  if (!user) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-3xl">
        <div className="text-center py-10">
          <h2 className="text-xl font-bold mb-2">사용자 정보를 불러올 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">로그인이 필요하거나 권한이 없습니다.</p>
          <Button onClick={() => router.push("/login")}>로그인 페이지로 이동</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">내 프로필</h1>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4 w-full flex">
          <TabsTrigger value="profile" className="flex-1">
            프로필 정보
          </TabsTrigger>
          <TabsTrigger value="password" className="flex-1">
            비밀번호 변경
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <form onSubmit={handleProfileUpdate}>
              <CardHeader>
                <CardTitle>프로필 정보</CardTitle>
                <CardDescription>개인 정보를 확인하고 수정할 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" value={user.email} disabled />
                  <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={user.full_name}
                    onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">학교</Label>
                  <Input
                    id="school"
                    value={user.school}
                    onChange={(e) => setUser({ ...user, school: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">학과</Label>
                  <Input
                    id="department"
                    value={user.department}
                    onChange={(e) => setUser({ ...user, department: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? "저장 중..." : "변경사항 저장"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <form onSubmit={handlePasswordChange}>
              <CardHeader>
                <CardTitle>비밀번호 변경</CardTitle>
                <CardDescription>계정 비밀번호를 변경할 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">현재 비밀번호</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">새 비밀번호</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? "변경 중..." : "비밀번호 변경"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
