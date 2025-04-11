"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function SignupCompletePage() {
  return (
    <div>
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">동아리 출석 체크</h1>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link href="/login">로그인</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">회원가입 완료</CardTitle>
            <CardDescription className="text-center">
              이메일 인증을 완료해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>
              회원가입이 성공적으로 처리되었습니다.
              <br />
              입력하신 이메일로 인증 링크를 보냈습니다.
              <br />
              이메일에 포함된 링크를 클릭하여 계정을 활성화해 주세요.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button asChild className="w-full">
              <Link href="/login">로그인 페이지로 이동</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}