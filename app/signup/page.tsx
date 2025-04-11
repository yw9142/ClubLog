"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { signUp } from "@/lib/supabase"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [school, setSchool] = useState("")
  const [department, setDepartment] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log('회원가입 정보:', { email, name, school, department })
      
      // Supabase Auth 회원가입 처리
      const { data, error } = await signUp({
        email,
        password,
        metadata: {
          full_name: name,
          school,
          department
        }
      })

      if (error) {
        console.error('회원가입 실패 상세:', error)
        throw error
      }
      
      console.log('회원가입 성공:', data)

      toast({
        title: "회원가입 이메일 발송됨",
        description: "이메일에 포함된 링크를 클릭하여 계정을 활성화해 주세요.",
      })

      router.push("/login")
    } catch (error: any) {
      console.error('회원가입 예외:', error)
      toast({
        title: "회원가입 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      })
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
            <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
            <CardDescription className="text-center">계정 정보를 입력하여 회원가입하세요</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
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
                <Label htmlFor="name">이름</Label>
                <Input 
                  id="name" 
                  placeholder="홍길동" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">학교</Label>
                <Input
                  id="school"
                  placeholder="한국외국어대학교"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">학과</Label>
                <Input
                  id="department"
                  placeholder="컴퓨터공학과"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
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
                {isLoading ? "가입 중..." : "회원가입"}
              </Button>
              <div className="text-center text-sm">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  로그인
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
