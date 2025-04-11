"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

// 타입 정의
type PersonalStat = {
  clubId: string;
  clubName: string;
  attendanceRate: number;
  totalSessions: number;
  attended: number;
}

type MemberStat = {
  id: string;
  name: string;
  attendanceRate: number;
  attended: number;
}

type ClubStat = {
  id: string;
  name: string;
  overallRate: number;
  totalSessions: number;
  memberStats: MemberStat[];
  sessionStats: { date: string; rate: number }[];
}

type Club = {
  id: string;
  name: string;
}

export default function StatisticsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [personalStats, setPersonalStats] = useState<PersonalStat[]>([])
  const [selectedClubId, setSelectedClubId] = useState<string>("")
  const [clubStats, setClubStats] = useState<ClubStat | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  
  // 월별 출석률 차트 데이터
  const [monthlyData, setMonthlyData] = useState<{month: string; rate: number}[]>([])
  
  // 색상 배열
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // 사용자의 가입 동아리 목록 가져오기
  useEffect(() => {
    async function fetchUserClubs() {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast({
            title: "로그인 필요",
            description: "통계를 확인하려면 로그인이 필요합니다.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        // 사용자가 속한 동아리 가져오기
        const { data: memberships, error: membershipError } = await supabase
          .from('club_members')
          .select('club:clubs(id, name)')
          .eq('user_id', user.id)

        if (membershipError) throw membershipError
        
        // 동아리 목록 생성
        const userClubs: Club[] = memberships.map(m => ({
          id: (m.club as any).id,
          name: (m.club as any).name
        }))
        
        setClubs(userClubs)
        
        // 첫번째 클럽 선택
        if (userClubs.length > 0) {
          setSelectedClubId(userClubs[0].id)
        }
        
        // 개인 통계 데이터 가져오기
        const personalStatsData: PersonalStat[] = []
        
        for (const club of userClubs) {
          // 동아리의 총 세션 수 확인
          const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select('id')
            .eq('club_id', club.id)
          
          if (sessionsError) throw sessionsError
          const totalSessions = sessions.length
          
          if (totalSessions === 0) {
            // 세션이 없는 경우
            personalStatsData.push({
              clubId: club.id,
              clubName: club.name,
              attendanceRate: 0,
              totalSessions: 0,
              attended: 0
            })
            continue
          }
          
          // 사용자의 출석 기록 확인
          let attendedCount = 0
          for (const session of sessions) {
            const { data: attendance, error: attendanceError } = await supabase
              .from('attendances')
              .select('status')
              .eq('session_id', session.id)
              .eq('user_id', user.id)
              .in('status', ['present', 'late'])
              .maybeSingle()
            
            if (!attendanceError && attendance) {
              attendedCount++
            }
          }
          
          const attendanceRate = Math.round((attendedCount / totalSessions) * 100)
          
          personalStatsData.push({
            clubId: club.id,
            clubName: club.name,
            attendanceRate,
            totalSessions,
            attended: attendedCount
          })
        }
        
        setPersonalStats(personalStatsData)
        
        // 월별 출석률 데이터 생성
        await generateMonthlyData(user.id)

      } catch (error: any) {
        toast({
          title: "데이터 로딩 실패",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    // 월별 출석률 데이터 생성 함수
    async function generateMonthlyData(userId: string) {
      try {
        // 현재 날짜에서 6개월 이전 날짜 계산
        const now = new Date()
        const sixMonthsAgo = new Date(now)
        sixMonthsAgo.setMonth(now.getMonth() - 5) // 현재 월 포함 6개월
        
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
        
        // 월별 데이터 배열 초기화
        const monthlyDataArray = []
        
        // 최근 6개월 데이터 생성
        for (let i = 0; i < 6; i++) {
          const currentMonth = new Date(sixMonthsAgo)
          currentMonth.setMonth(sixMonthsAgo.getMonth() + i)
          
          const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
          const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
          
          // 해당 월의 모든 세션 가져오기
          const { data: monthlySessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select('id')
            .gte('start_time', monthStart.toISOString())
            .lte('start_time', monthEnd.toISOString())
          
          if (sessionsError) throw sessionsError
          
          const totalSessions = monthlySessions?.length || 0
          if (totalSessions === 0) {
            monthlyDataArray.push({
              month: monthNames[currentMonth.getMonth()],
              rate: 0
            })
            continue
          }
          
          // 해당 월의 사용자 출석 수 계산
          let attendedCount = 0
          for (const session of monthlySessions) {
            const { data: attendance, error: attendanceError } = await supabase
              .from('attendances')
              .select('*')
              .eq('session_id', session.id)
              .eq('user_id', userId)
              .in('status', ['present', 'late'])
              .maybeSingle()
            
            if (!attendanceError && attendance) {
              attendedCount++
            }
          }
          
          const rate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0
          
          monthlyDataArray.push({
            month: monthNames[currentMonth.getMonth()],
            rate
          })
        }
        
        setMonthlyData(monthlyDataArray)
        
      } catch (error: any) {
        console.error("월별 데이터 생성 오류:", error)
      }
    }

    fetchUserClubs()
  }, [toast, router])

  // 동아리 통계 데이터 가져오기
  useEffect(() => {
    async function fetchClubStatistics(clubId: string) {
      if (!clubId) return
      
      try {
        setLoading(true)
        
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        // 동아리 정보 가져오기
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single()
          
        if (clubError) throw clubError
        
        // 동아리의 모든 세션 가져오기
        const { data: sessions, error: sessionsError } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('club_id', clubId)
          .order('start_time', { ascending: false })
          
        if (sessionsError) throw sessionsError
        const totalSessions = sessions.length
        
        if (totalSessions === 0) {
          setClubStats({
            id: clubId,
            name: clubData.name,
            overallRate: 0,
            totalSessions: 0,
            memberStats: [],
            sessionStats: []
          })
          return
        }
        
        // 동아리의 모든 멤버 가져오기
        const { data: members, error: membersError } = await supabase
          .from('club_members')
          .select(`
            user_id,
            profile:profiles(full_name)
          `)
          .eq('club_id', clubId)
          
        if (membersError) throw membersError
        
        // 각 멤버별 출석률 계산
        const memberStatsData: MemberStat[] = []
        let totalAttendance = 0
        
        for (const member of members) {
          let memberAttendance = 0
          
          for (const session of sessions) {
            const { data: attendance, error: attendanceError } = await supabase
              .from('attendances')
              .select('*')
              .eq('session_id', session.id)
              .eq('user_id', member.user_id)
              .in('status', ['present', 'late'])
              .maybeSingle()
              
            if (!attendanceError && attendance) {
              memberAttendance++
              totalAttendance++
            }
          }
          
          const attendanceRate = Math.round((memberAttendance / totalSessions) * 100)
          
          memberStatsData.push({
            id: member.user_id,
            name: (member.profile as any).full_name || '이름 없음',
            attendanceRate,
            attended: memberAttendance
          })
        }
        
        // 전체 출석률 계산
        const overallRate = Math.round((totalAttendance / (totalSessions * members.length)) * 100) || 0
        
        // 세션별 출석률 데이터
        const sessionStatsData = sessions.slice(0, 10).map(session => {
          const sessionDate = new Date(session.start_time).toLocaleDateString()
          // 실제 구현에서는 각 세션의 출석률도 계산
          return {
            date: sessionDate,
            rate: Math.round(Math.random() * 30 + 70) // 임시 랜덤 데이터
          }
        })
        
        // 멤버 통계 정렬 (출석률 내림차순)
        memberStatsData.sort((a, b) => b.attendanceRate - a.attendanceRate)
        
        setClubStats({
          id: clubId,
          name: clubData.name,
          overallRate,
          totalSessions,
          memberStats: memberStatsData,
          sessionStats: sessionStatsData
        })
        
      } catch (error: any) {
        toast({
          title: "동아리 통계 로딩 실패",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (selectedClubId) {
      fetchClubStatistics(selectedClubId)
    }
  }, [selectedClubId, toast])

  // 통계 CSV 다운로드
  const handleDownloadStats = () => {
    if (!clubStats) return
    
    // CSV 헤더 및 데이터 생성
    const headers = ['이름', '출석률 (%)', '참석 횟수', '총 세션']
    
    const csvData = [
      headers.join(','),
      ...clubStats.memberStats.map(member => {
        return [
          member.name,
          member.attendanceRate,
          member.attended,
          clubStats.totalSessions
        ].join(',')
      })
    ].join('\n')
    
    // 다운로드 링크 생성
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `출석통계_${clubStats.name}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "통계 다운로드",
      description: "통계 데이터가 CSV 파일로 다운로드되었습니다.",
    })
  }

  // 로딩 화면
  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex justify-center items-center h-[70vh]">
        <p>통계 데이터를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">출석 통계</h1>
          <p className="text-muted-foreground">동아리 출석 현황 및 통계</p>
        </div>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="mb-4 w-full flex">
          <TabsTrigger value="personal" className="flex-1">
            내 출석 통계
          </TabsTrigger>
          <TabsTrigger value="club" className="flex-1">
            동아리 통계
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          {personalStats.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                {personalStats.map((stat) => (
                  <Card key={stat.clubId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{stat.clubName}</CardTitle>
                      <CardDescription>내 출석 현황</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">출석률</span>
                          <span className="text-2xl font-bold">{stat.attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${stat.attendanceRate}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>참석: {stat.attended}회</span>
                          <span>총 세션: {stat.totalSessions}회</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>월별 출석 현황</CardTitle>
                  <CardDescription>최근 6개월 출석률 추이</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="rate" fill="#3b82f6" name="출석률" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">출석 데이터가 없습니다.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>출석 통계 없음</CardTitle>
                <CardDescription>가입한 동아리가 없거나 출석 기록이 없습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">동아리에 가입하고 출석 체크를 시작해보세요!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="club">
          {clubs.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row items-center mb-6 gap-4">
                <div className="flex-1 max-w-xs w-full">
                  <Select 
                    value={selectedClubId} 
                    onValueChange={setSelectedClubId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="동아리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map((club) => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={handleDownloadStats} disabled={!clubStats}>
                  <Download className="mr-2 h-4 w-4" />
                  통계 다운로드
                </Button>
              </div>

              {clubStats ? (
                <>
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">전체 출석률</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{clubStats.overallRate}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${clubStats.overallRate}%` }}></div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">총 세션 수</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{clubStats.totalSessions}회</div>
                      </CardContent>
                    </Card>
                    {clubStats.memberStats.length > 0 && (
                      <>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">최고 출석률</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{clubStats.memberStats[0].attendanceRate}%</div>
                            <p className="text-xs text-muted-foreground">{clubStats.memberStats[0].name}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">최저 출석률</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {clubStats.memberStats[clubStats.memberStats.length - 1].attendanceRate}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {clubStats.memberStats[clubStats.memberStats.length - 1].name}
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>멤버별 출석률</CardTitle>
                        <CardDescription>동아리 멤버 개인별 출석 현황</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {clubStats.memberStats.length > 0 ? (
                          <div className="space-y-4">
                            {clubStats.memberStats.map((member) => (
                              <div key={member.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{member.name}</span>
                                  <span className="text-sm font-bold">{member.attendanceRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${member.attendanceRate}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                  {member.attended}/{clubStats.totalSessions}회 참석
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-60">
                            <p className="text-muted-foreground">멤버가 없거나 출석 데이터가 없습니다.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>출석률 분포</CardTitle>
                        <CardDescription>멤버별 출석률 분포 현황</CardDescription>
                      </CardHeader>
                      <CardContent className="h-80">
                        {clubStats.memberStats.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={clubStats.memberStats}
                                dataKey="attendanceRate"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label={({ name, attendanceRate }) => `${name}: ${attendanceRate}%`}
                              >
                                {clubStats.memberStats.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">출석 데이터가 없습니다.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-60">
                  <p className="text-muted-foreground">통계 데이터를 불러오는 중입니다...</p>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>통계 조회 불가</CardTitle>
                <CardDescription>가입한 동아리가 없습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">동아리에 가입하여 통계를 확인해보세요!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
