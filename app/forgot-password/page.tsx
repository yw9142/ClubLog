"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    try {
      // Supabase Auth의 비밀번호 재설정 메일 발송
      // type=recovery 파라미터를 명시적으로 추가하여 비밀번호 재설정 링크임을 표시
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) {
        console.error('비밀번호 재설정 메일 발송 실패:', error)
        setErrorMessage(error.message || "비밀번호 재설정 이메일을 보내는 중 오류가 발생했습니다.")
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
            <CardTitle className="text-2xl font-bold text-center">비밀번호 찾기</CardTitle>
            <CardDescription className="text-center">
              가입한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다
            </CardDescription>
          </CardHeader>
          {isSubmitted ? (
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium">비밀번호 재설정 이메일을 발송했습니다</p>
                <p className="text-sm text-muted-foreground">
                  {email} 주소로 비밀번호 재설정 링크를 보냈습니다.<br />
                  메일함을 확인하고 링크를 클릭하여 비밀번호를 재설정해주세요.
                </p>
                <p className="text-xs text-muted-foreground">
                  이메일이 보이지 않으면 스팸함을 확인하거나 몇 분 후에 다시 시도해주세요.
                </p>
              </div>
              <Button asChild className="w-full mt-4">
                <Link href="/login">로그인 페이지로 돌아가기</Link>
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
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "처리 중..." : "비밀번호 재설정 이메일 받기"}
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