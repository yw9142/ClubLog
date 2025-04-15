"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Club } from "@/lib/types"

export default function CreateAttendancePage() {
  const searchParams = useSearchParams()
  const clubIdParam = searchParams.get("clubId")

  // 날짜와 시간의 기본값 설정을 위한 함수
  const getDefaultDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0] // YYYY-MM-DD 형식
  }

  const getDefaultTime = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  const getDefaultEndTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 10) // 현재 시각 + 10분
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [clubId, setClubId] = useState(clubIdParam || "")
  const [date, setDate] = useState(getDefaultDate())
  const [startTime, setStartTime] = useState(getDefaultTime())
  const [endTime, setEndTime] = useState(getDefaultEndTime())
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClubs, setIsLoadingClubs] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUserClubs() {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast({
            title: "로그인 필요",
            description: "출석 세션을 생성하려면 로그인이 필요합니다.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        // 사용자가 관리자로 속한 동아리 목록 가져오기
        const { data: memberClubs, error: memberError } = await supabase
          .from('club_members')
          .select('club:clubs(*)')
          .eq('user_id', user.id)
          .eq('role', 'admin')

        if (memberError) throw memberError

        // 사용자가 생성한 동아리 목록 가져오기
        const { data: createdClubs, error: createdError } = await supabase
          .from('clubs')
          .select('*')
          .eq('created_by', user.id)

        if (createdError) throw createdError

        // 동아리 목록 병합 (중복 제거)
        const memberClubList = memberClubs.map(item => item.club as Club)
        const allClubs = [...memberClubList]
        
        createdClubs.forEach(createdClub => {
          if (!allClubs.some(club => club.id === createdClub.id)) {
            allClubs.push(createdClub)
          }
        })
        
        setClubs(allClubs)
      } catch (error: any) {
        toast({
          title: "동아리 목록 로딩 실패",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoadingClubs(false)
      }
    }

    fetchUserClubs()
  }, [toast, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!date || !startTime || !endTime || !title || !clubId) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)

    try {
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "로그인 필요",
          description: "출석 세션을 생성하려면 로그인이 필요합니다.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      // 시작 시간과 종료 시간 조합
      const startDateTime = new Date(`${date}T${startTime}:00`)
      const endDateTime = new Date(`${date}T${endTime}:00`)
      
      // 유효성 검사
      if (endDateTime <= startDateTime) {
        toast({
          title: "시간 오류",
          description: "종료 시간은 시작 시간보다 늦어야 합니다.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // 출석 세션 생성
      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert([
          {
            club_id: clubId,
            title,
            description,
            location,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            created_by: user.id
          }
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "출석 세션 생성 완료",
        description: "QR 코드 화면으로 이동합니다.",
      })

      // 생성된 세션 ID로 QR 코드 페이지로 이동
      router.push(`/attendance/${data.id}/qr`)
    } catch (error: any) {
      toast({
        title: "출석 세션 생성 실패",
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
              {isLoadingClubs ? (
                <p className="text-sm text-muted-foreground">동아리 목록 로딩 중...</p>
              ) : (
                <Select value={clubId} onValueChange={setClubId} required>
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
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">세션 제목</Label>
              <Input
                id="title"
                placeholder="예: 4월 첫째주 모임"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택사항)</Label>
              <Textarea
                id="description"
                placeholder="세션에 대한 간단한 설명을 입력하세요"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">장소 (선택사항)</Label>
              <Input
                id="location"
                placeholder="예: 제1공학관 201호"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">날짜</Label>
              <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">시작 시간</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">종료 시간</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required 
                />
              </div>
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
                disabled={isLoading || isLoadingClubs}
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
