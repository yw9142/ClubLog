"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CalendarDays, QrCode, Users, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface Club {
  id: string
  name: string
  memberCount: number
  role: string
}

interface AttendanceRecord {
  id: string
  clubName: string
  date: string
  status: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [clubs, setClubs] = useState<Club[]>([])
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])
  const [attendanceRate, setAttendanceRate] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)
        
        // 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error("로그인되지 않은 사용자")
          router.push("/login")
          return
        }

        // 가입한 동아리 정보 가져오기
        const { data: clubMembers, error: clubsError } = await supabase
          .from('club_members')
          .select(`
            role,
            clubs (
              id,
              name
            )
          `)
          .eq('user_id', user.id)

        if (clubsError) {
          console.error("동아리 정보 조회 오류:", clubsError)
          throw clubsError
        }

        // 각 동아리 멤버 수 가져오기 - 병렬로 조회
        const clubsWithMemberCount = await Promise.all(
          clubMembers.map(async (member) => {
            const { count, error: countError } = await supabase
              .from('club_members')
              .select('*', { count: 'exact', head: true })
              .eq('club_id', member.clubs.id)
            
            return {
              id: member.clubs.id,
              name: member.clubs.name,
              memberCount: count || 0,
              role: member.role === 'admin' ? '관리자' : '회원'
            }
          })
        )

        // 최근 출석 기록 가져오기 (최대 3개)
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendances')
          .select(`
            id,
            status,
            attendance_sessions (
              start_time,
              clubs (
                name
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)

        if (attendanceError) {
          console.error("출석 기록 조회 오류:", attendanceError)
          throw attendanceError
        }

        // 이번 달 출석률 계산
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        
        // 전체 출석 세션 수
        const { data: allSessions, error: sessionsError } = await supabase
          .from('attendance_sessions')
          .select('id')
          .gte('start_time', firstDayOfMonth)
          .in('club_id', clubsWithMemberCount.map(club => club.id))

        if (sessionsError) {
          console.error("출석 세션 조회 오류:", sessionsError)
          throw sessionsError
        }

        // 출석한 세션 수
        const { data: attendedSessions, error: attendedError } = await supabase
          .from('attendances')
          .select(`
            id,
            attendance_sessions!inner (
              id,
              start_time
            )
          `)
          .gte('attendance_sessions.start_time', firstDayOfMonth)
          .eq('user_id', user.id)
          .in('status', ['present', 'late'])

        if (attendedError) {
          console.error("출석 세션 조회 오류:", attendedError)
          throw attendedError
        }

        // 다가오는 출석 세션 수 계산
        const now2 = new Date().toISOString()
        const { count: upcomingCount, error: upcomingError } = await supabase
          .from('attendance_sessions')
          .select('*', { count: 'exact', head: true })
          .gt('start_time', now2)
          .in('club_id', clubsWithMemberCount.map(club => club.id))

        if (upcomingError) {
          console.error("다가오는 세션 조회 오류:", upcomingError)
          throw upcomingError
        }

        // 포맷팅
        const formattedAttendance = attendanceData.map(record => ({
          id: record.id,
          clubName: record.attendance_sessions.clubs.name,
          date: new Date(record.attendance_sessions.start_time).toLocaleDateString('ko-KR'),
          status: record.status === 'present' ? '출석' : 
                  record.status === 'late' ? '지각' : 
                  record.status === 'excused' ? '사유결석' : '결석',
        }))

        // 출석률 계산
        let rate = 0
        if (allSessions && allSessions.length > 0) {
          const attendedCount = attendedSessions ? attendedSessions.length : 0
          rate = Math.round((attendedCount / allSessions.length) * 100)
        }

        setClubs(clubsWithMemberCount)
        setRecentAttendance(formattedAttendance)
        setAttendanceRate(rate)
        setUpcomingEvents(upcomingCount || 0)

      } catch (error: any) {
        console.error('대시보드 데이터 로딩 오류:', error)
        toast({
          title: "데이터 로딩 실패",
          description: error.message || "데이터를 불러오는 도중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [router, toast])

  const handleScanQR = () => {
    router.push("/attendance/scan")
  }

  // 로딩 상태에 따른 UI 처리
  const LoadingUI = () => (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
    </div>
  )

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-muted-foreground">동아리 활동과 출석 현황을 확인하세요.</p>
        </div>
      </div>

      {/* 출석 체크 버튼 - 크고 눈에 띄게 */}
      <Card className="mb-8 bg-blue-50 border-blue-200">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center">
            <QrCode className="h-12 w-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-bold mb-2">출석 체크하기</h2>
            <p className="text-muted-foreground mb-4">QR 코드를 스캔하여 동아리 활동 출석을 체크하세요</p>
            <Button size="lg" className="w-full max-w-xs" onClick={handleScanQR}>
              <QrCode className="mr-2 h-5 w-5" />
              QR 코드 스캔하기
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">내 동아리</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-8">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{clubs.length}</div>
                <p className="text-xs text-muted-foreground">가입한 동아리 수</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">관리 동아리</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-8">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{clubs.filter((club) => club.role === "관리자").length}</div>
                <p className="text-xs text-muted-foreground">내가 관리하는 동아리 수</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">이번 달 출석률</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-8">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">전체 동아리 평균</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">다음 일정</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-8">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">다가오는 일정 수</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>내 동아리</CardTitle>
            <CardDescription>가입한 동아리 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingUI />
            ) : clubs.length > 0 ? (
              <div className="space-y-4">
                {clubs.map((club) => (
                  <div key={club.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium">{club.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        멤버 {club.memberCount}명 • {club.role}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/clubs/${club.id}`}>상세보기</Link>
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/clubs">모든 동아리 보기</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                가입한 동아리가 없습니다.
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/clubs">동아리 찾아보기</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 출석 기록</CardTitle>
            <CardDescription>최근 출석 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingUI />
            ) : recentAttendance.length > 0 ? (
              <div className="space-y-4">
                {recentAttendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-medium">{record.clubName}</h3>
                      <p className="text-sm text-muted-foreground">{record.date}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === "출석" ? "bg-green-100 text-green-800" : 
                        record.status === "지각" ? "bg-yellow-100 text-yellow-800" :
                        record.status === "사유결석" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.status}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/attendance">모든 출석 기록 보기</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                출석 기록이 없습니다.
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/attendance">출석 관리 페이지로 이동</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
