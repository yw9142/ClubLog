"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea as TextareaPrimitive } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase" // Supabase 클라이언트 import

export default function CreateClubPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "로그인 필요",
          description: "동아리를 생성하려면 로그인이 필요합니다.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      // 동아리 생성
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert([
          {
            name,
            description,
            created_by: user.id
          }
        ])
        .select()
        .single()

      if (clubError) throw clubError

      // 생성자를 관리자로 등록
      const { error: memberError } = await supabase
        .from('club_members')
        .insert([
          {
            club_id: club.id,
            user_id: user.id,
            role: 'admin'
          }
        ])

      if (memberError) throw memberError

      toast({
        title: "동아리 생성 완료",
        description: "새로운 동아리가 생성되었습니다.",
      })

      router.push("/clubs")
    } catch (error: any) {
      toast({
        title: "동아리 생성 실패",
        description: error.message || "다시 시도해주세요.",
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
        <h1 className="text-2xl font-bold">새 동아리 생성</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>동아리 정보</CardTitle>
            <CardDescription>새로운 동아리의 기본 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">동아리 이름</Label>
              <Input
                id="name"
                placeholder="동아리 이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">동아리 설명</Label>
              <TextareaPrimitive
                id="description"
                placeholder="동아리에 대한 간단한 설명을 입력하세요"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto order-1 sm:order-2">
              {isLoading ? "생성 중..." : "동아리 생성"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
