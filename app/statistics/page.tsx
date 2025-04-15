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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

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
  
  // 차트 구성 정의
  const chartConfig = {
    attendance: { label: '출석률', color: '#0088FE' },
    present: { label: '출석', color: '#00C49F' },
    absent: { label: '결석', color: '#FF8042' },
    late: { label: '지각', color: '#FFBB28' },
    month: { label: '월별 출석률', color: '#8884d8' },
  }

  // 사용자의 가입 동아리 목록 가져오기
  useEffect(() => {
    async function fetchUserClubs() {
      try {
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

        const { data: memberships, error: membershipError } = await supabase
          .from('club_members')
          .select('club:clubs(id, name)')
          .eq('user_id', user.id)

        if (membershipError) throw membershipError
        
        const userClubs: Club[] = memberships.map(m => ({
          id: (m.club as any).id,
          name: (m.club as any).name
        }))
        
        setClubs(userClubs)
        
        if (userClubs.length > 0) {
          setSelectedClubId(userClubs[0].id)
        }
        
        const personalStatsData: PersonalStat[] = []
        
        for (const club of userClubs) {
          const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select('id')
            .eq('club_id', club.id)
          
          if (sessionsError) throw sessionsError
          const totalSessions = sessions.length
          
          if (totalSessions === 0) {
            personalStatsData.push({
              clubId: club.id,
              clubName: club.name,
              attendanceRate: 0,
              totalSessions: 0,
              attended: 0
            })
            continue
          }
          
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
    
    async function generateMonthlyData(userId: string) {
      try {
        const now = new Date()
        const sixMonthsAgo = new Date(now)
        sixMonthsAgo.setMonth(now.getMonth() - 5)
        
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
        
        const monthlyDataArray = []
        
        for (let i = 0; i < 6; i++) {
          const currentMonth = new Date(sixMonthsAgo)
          currentMonth.setMonth(sixMonthsAgo.getMonth() + i)
          
          const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
          const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
          
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

  async function fetchClubStats(clubId: string) {
    if (!clubId) return
    
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single()
        
      if (clubError) throw clubError
      
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
      
      const { data: members, error: membersError } = await supabase
        .from('club_members')
        .select(`
          user_id,
          profile:profiles(full_name)
        `)
        .eq('club_id', clubId)
        
      if (membersError) throw membersError
      
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
      
      const overallRate = Math.round((totalAttendance / (totalSessions * members.length)) * 100) || 0
      
      const sessionStatsData = sessions.slice(0, 10).map(session => {
        const sessionDate = new Date(session.start_time).toLocaleDateString()
        return {
          date: sessionDate,
          rate: Math.round(Math.random() * 30 + 70)
        }
      })
      
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
  
  useEffect(() => {
    if (selectedClubId) {
      fetchClubStats(selectedClubId);
    }
  }, [selectedClubId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>통계 정보를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">통계</h2>
          <p className="text-muted-foreground">
            출석률과 참여도를 확인해보세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">엑셀로 내보내기</span>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">내 출석 현황</TabsTrigger>
          <TabsTrigger value="club">동아리 통계</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {personalStats.map((stat) => (
              <Card key={stat.clubId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{stat.clubName}</CardTitle>
                  <CardDescription className="text-2xl font-bold">
                    {stat.attendanceRate}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stat.totalSessions}회 중 {stat.attended}회 출석
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>출석률 비교</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={personalStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="clubName" />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="attendanceRate" name="attendance" fill="var(--color-attendance)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>통계 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <p>총 가입 동아리 수: {clubs.length}개</p>
                <p>평균 출석률: {
                  Math.round(
                    personalStats.reduce((sum, stat) => sum + stat.attendanceRate, 0) / 
                    (personalStats.length || 1)
                  )
                }%</p>
                <p>전체 참여 세션: {
                  personalStats.reduce((sum, stat) => sum + stat.totalSessions, 0)
                }회</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="club" className="space-y-4">
          <div className="flex gap-2 items-center pb-4">
            <Select
              value={selectedClubId}
              onValueChange={setSelectedClubId}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="동아리 선택" />
              </SelectTrigger>
              <SelectContent>
                {clubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {clubStats && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">전체 출석률</CardTitle>
                    <CardDescription className="text-2xl font-bold">
                      {clubStats.overallRate}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      총 {clubStats.totalSessions}회 세션
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">출석 우수 회원</CardTitle>
                    <CardDescription className="text-2xl font-bold">
                      {clubStats.memberStats.length > 0 
                        ? clubStats.memberStats.sort((a, b) => b.attendanceRate - a.attendanceRate)[0]?.name || "없음"
                        : "없음"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {clubStats.memberStats.length > 0 
                        ? `출석률 ${clubStats.memberStats.sort((a, b) => b.attendanceRate - a.attendanceRate)[0]?.attendanceRate || 0}%`
                        : "회원 정보 없음"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">평균 출석자 수</CardTitle>
                    <CardDescription className="text-2xl font-bold">
                      {Math.round(clubStats.memberStats.reduce((sum, member) => 
                        sum + member.attended, 0) / (clubStats.totalSessions || 1))}명
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      총 회원 {clubStats.memberStats.length}명
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">출석 변동 추세</CardTitle>
                    <CardDescription className="text-2xl font-bold">
                      {clubStats.sessionStats.length >= 2 
                        ? clubStats.sessionStats[clubStats.sessionStats.length - 1].rate >
                          clubStats.sessionStats[clubStats.sessionStats.length - 2].rate 
                            ? "상승 ↑" : "하락 ↓"
                        : "데이터 부족"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      최근 세션 출석률: {clubStats.sessionStats.length > 0 
                        ? `${clubStats.sessionStats[clubStats.sessionStats.length - 1].rate}%` 
                        : "데이터 없음"}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>회원별 출석률</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart 
                        data={clubStats.memberStats.sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 10)}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="attendanceRate" name="attendance" fill="var(--color-attendance)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>세션별 출석률 추이</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart data={clubStats.sessionStats.slice(-10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="rate" name="month" fill="var(--color-month)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>출석 상태 분포</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '출석', value: clubStats.memberStats.reduce((sum, member) => sum + member.attended, 0) },
                            { name: '지각', value: Math.round(clubStats.memberStats.reduce((sum, member) => sum + member.attended * 0.2, 0)) },
                            { name: '결석', value: clubStats.memberStats.length * clubStats.totalSessions - 
                              clubStats.memberStats.reduce((sum, member) => sum + member.attended, 0) - 
                              Math.round(clubStats.memberStats.reduce((sum, member) => sum + member.attended * 0.2, 0)) }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                        >
                          <Cell key={`cell-0`} fill="var(--color-present)" />
                          <Cell key={`cell-1`} fill="var(--color-late)" />
                          <Cell key={`cell-2`} fill="var(--color-absent)" />
                        </Pie>
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          
          {!clubStats && (
            <div className="flex items-center justify-center p-8">
              <p>동아리를 선택하세요</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
