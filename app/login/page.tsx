"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { signIn } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"

// 검색 파라미터를 처리하는 컴포넌트
function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { refreshProfile } = useUserProfile()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null) // 이전 오류 메시지 초기화

    try {
      console.log('로그인 시도:', { email })
      
      const { data, error } = await signIn({
        email,
        password
      })

      if (error) {
        console.error('로그인 실패:', error)
        setErrorMessage(error.message || "이메일 또는 비밀번호가 올바르지 않습니다.")
        throw error
      }

      console.log('로그인 성공:', data)
      
      // 로그인 성공 시 사용자 프로필 정보 갱신
      await refreshProfile()

      toast({
        title: "로그인 성공",
        description: "페이지로 이동합니다.",
      })
      
      // 강제로 페이지 이동
      window.location.href = redirectPath
    } catch (error: any) {
      console.error('로그인 실패:', error)
      // 오류 메시지는 이미 setErrorMessage에서 설정됨
    } finally {
      setIsLoading(false)
    }
  }

  // 개발 디버깅용 로그
  useEffect(() => {
    console.log('현재 리다이렉션 경로:', redirectPath)
  }, [redirectPath])

  return (
    <>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {/* 오류 메시지 표시 */}
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="text-right text-sm">
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
          <div className="text-center text-sm">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </>
  )
}

export default function LoginPage() {
  const router = useRouter()
  
  return (
    <div>
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700 cursor-pointer" onClick={() => router.push("/")}>동아리 출석 체크</h1>
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
            <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
            <CardDescription className="text-center">아래 정보를 입력하여 로그인하세요</CardDescription>
          </CardHeader>
          <Suspense fallback={<CardContent className="space-y-4"><div>로딩 중...</div></CardContent>}>
            <LoginForm />
          </Suspense>
        </Card>
      </div>
    </div>
  )
}
