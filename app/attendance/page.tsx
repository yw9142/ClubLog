"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Download, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

// 타입 정의
interface AttendanceRecord {
  id: string
  clubName: string
  sessionName: string
  date: string
  status: string
}

interface SessionRecord {
  id: string
  clubName: string
  name: string
  date: string
  attendanceCount: number
  totalCount: number
}

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        
        // 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error("로그인되지 않은 사용자")
          return
        }

        // 내 출석 기록 가져오기
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendances')
          .select(`
            id,
            status,
            check_in_time,
            attendance_sessions (
              id,
              title,
              start_time,
              clubs (
                name
              )
            )
          `)
          .eq('user_id', user.id)

        if (attendanceError) {
          console.error("출석 기록 조회 오류:", attendanceError)
          throw attendanceError
        }

        // 소속된 동아리의 출석 세션 가져오기
        const { data: memberClubs, error: memberError } = await supabase
          .from('club_members')
          .select('club_id')
          .eq('user_id', user.id)

        if (memberError) {
          console.error("소속 동아리 조회 오류:", memberError)
          throw memberError
        }

        const clubIds = memberClubs.map(club => club.club_id)
        
        // 출석 세션 가져오기 (소속된 동아리만)
        const { data: sessionData, error: sessionError } = await supabase
          .from('attendance_sessions')
          .select(`
            id,
            title,
            start_time,
            clubs (
              id, 
              name
            ),
            attendances (
              id,
              status
            )
          `)
          .in('club_id', clubIds)

        if (sessionError) {
          console.error("출석 세션 조회 오류:", sessionError)
          throw sessionError
        }

        // 출석 기록 포맷팅
        const formattedAttendanceRecords = attendanceData.map(record => ({
          id: record.id,
          clubName: record.attendance_sessions.clubs.name,
          sessionName: record.attendance_sessions.title,
          date: new Date(record.attendance_sessions.start_time).toLocaleDateString('ko-KR'),
          status: record.status === 'present' ? '출석' : 
                  record.status === 'late' ? '지각' : 
                  record.status === 'excused' ? '사유결석' : '결석',
        }))

        // 출석 세션 포맷팅
        const formattedSessions = sessionData.map(session => {
          const presentCount = session.attendances.filter(a => a.status === 'present' || a.status === 'late').length
          const totalCount = session.attendances.length
          
          return {
            id: session.id,
            clubName: session.clubs.name,
            name: session.title,
            date: new Date(session.start_time).toLocaleDateString('ko-KR'),
            attendanceCount: presentCount,
            totalCount: totalCount || 0,
          }
        })

        setAttendanceRecords(formattedAttendanceRecords)
        setSessions(formattedSessions)

      } catch (error: any) {
        toast({
          title: "데이터 로딩 실패",
          description: error.message || "데이터를 불러오는 도중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // 검색 필터링
  const filteredAttendanceRecords = attendanceRecords.filter((record) =>
    record.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.sessionName.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredSessions = sessions.filter((session) =>
    session.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">출석 관리</h1>
          <p className="text-muted-foreground">출석 기록 및 세션 관리</p>
        </div>
      </div>

      <div className="flex items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="출석 기록 검색..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="my-attendance">
        <TabsList className="mb-4 w-full flex">
          <TabsTrigger value="my-attendance" className="flex-1">
            내 출석 기록
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1">
            출석 세션
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-attendance">
          <Card>
            <CardHeader>
              <CardTitle>내 출석 기록</CardTitle>
              <CardDescription>동아리 활동 출석 기록</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
                </div>
              ) : filteredAttendanceRecords.length > 0 ? (
                <div className="space-y-4">
                  {filteredAttendanceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="mb-2 sm:mb-0">
                        <h3 className="font-medium">
                          {record.clubName} - {record.sessionName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                          record.status === "출석"
                            ? "bg-green-100 text-green-800"
                            : record.status === "지각"
                              ? "bg-yellow-100 text-yellow-800"
                              : record.status === "사유결석"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  출석 기록이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>출석 세션</CardTitle>
                <CardDescription>생성된 출석 세션 목록</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="mt-4 sm:mt-0">
                <Download className="mr-2 h-4 w-4" />
                출석 내역 다운로드
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
                </div>
              ) : filteredSessions.length > 0 ? (
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="mb-2 sm:mb-0">
                        <h3 className="font-medium">
                          {session.clubName} - {session.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {session.date} • 출석: {session.attendanceCount}/{session.totalCount}명 (
                          {session.totalCount > 0 ? Math.round((session.attendanceCount / session.totalCount) * 100) : 0}%)
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="self-start sm:self-auto" asChild>
                        <Link href={`/attendance/${session.id}`}>상세보기</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  출석 세션이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
