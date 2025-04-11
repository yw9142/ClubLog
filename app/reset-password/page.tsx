"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // 페이지 로드시 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // 인증되지 않은 상태라면
        setIsAuthenticated(false)
        toast({
          title: "인증 필요",
          description: "비밀번호 재설정을 위해서는 인증된 링크가 필요합니다.",
          variant: "destructive",
        })
      } else {
        // 인증된 상태
        setIsAuthenticated(true)
      }
    }
    
    checkAuthStatus()
  }, [toast])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    
    // 비밀번호 일치 여부 확인
    if (password !== confirmPassword) {
      setErrorMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.")
      return
    }
    
    setIsLoading(true)

    try {
      // Supabase Auth를 사용한 비밀번호 업데이트
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('비밀번호 재설정 실패:', error)
        setErrorMessage(error.message || "비밀번호 재설정 중 오류가 발생했습니다.")
        throw error
      }

      // 제출 성공 상태로 변경
      setIsSubmitted(true)
    } catch (error: any) {
      console.error('비밀번호 재설정 예외:', error)
      // 오류 메시지는 이미 설정되었음
    } finally {
      setIsLoading(false)
    }
  }

  // 인증 상태를 확인 중일 때
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  // 인증되지 않은 상태라면
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">인증 필요</CardTitle>
            <CardDescription className="text-center">
              비밀번호 재설정을 위해 먼저 이메일 인증이 필요합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                유효하지 않거나 만료된 비밀번호 재설정 링크입니다.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-center text-muted-foreground">
              비밀번호를 재설정하려면 비밀번호 찾기 페이지에서 다시 시도해주세요.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/forgot-password">비밀번호 찾기 페이지로 이동</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">동아리 출석 체크</h1>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">회원가입</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">새 비밀번호 설정</CardTitle>
            <CardDescription className="text-center">
              새로운 비밀번호를 입력해주세요
            </CardDescription>
          </CardHeader>
          {isSubmitted ? (
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium">비밀번호가 성공적으로 변경되었습니다</p>
                <p className="text-sm text-muted-foreground">
                  새 비밀번호로 로그인할 수 있습니다.
                </p>
              </div>
              <Button onClick={() => router.push("/login")} className="w-full mt-4">
                로그인 페이지로 이동
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4 pt-4">
                {errorMessage && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">새 비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">비밀번호 확인</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "처리 중..." : "비밀번호 변경"}
                </Button>
                <div className="text-center text-sm">
                  <Link href="/login" className="text-blue-600 hover:underline">
                    로그인 페이지로 돌아가기
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}