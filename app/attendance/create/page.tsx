"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"

export default function CreateAttendancePage() {
  const searchParams = useSearchParams()
  const clubIdParam = searchParams.get("clubId")

  const [name, setName] = useState("")
  const [club, setClub] = useState(clubIdParam || "")
  const [date, setDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // 실제 구현에서는 API를 통해 데이터를 가져와야 함
  const clubs = [
    { id: 1, name: "프로그래밍 동아리" },
    { id: 2, name: "영어 회화 모임" },
    { id: 3, name: "독서 토론 모임" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 실제 구현에서는 API 호출로 출석 세션 생성
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "출석 세션 생성 완료",
        description: "QR 코드 화면으로 이동합니다.",
      })

      // 생성된 세션 ID (실제 구현에서는 API 응답에서 받아야 함)
      const sessionId = 123

      router.push(`/attendance/${sessionId}/qr`)
    } catch (error) {
      toast({
        title: "출석 세션 생성 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">출석 세션 생성</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>출석 세션 정보</CardTitle>
            <CardDescription>새로운 출석 체크를 위한 세션 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club">동아리</Label>
              <Select value={club} onValueChange={setClub} required>
                <SelectTrigger>
                  <SelectValue placeholder="동아리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">세션 이름</Label>
              <Input
                id="name"
                placeholder="예: 4월 첫째주 모임"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">날짜</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <div className="text-sm text-muted-foreground mb-2">
              세션을 생성하면 QR 코드 페이지로 자동으로 이동합니다. QR 코드를 통해 회원들의 출석을 체크할 수 있습니다.
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "생성 중..." : "세션 생성 및 QR 코드 생성"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
