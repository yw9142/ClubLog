"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Download, QrCode } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AttendanceSession, Attendance, Profile } from "@/lib/types"
import Link from "next/link"

type AttendanceWithProfile = Attendance & { profile: Profile };
type Params = { id: string } | Promise<{ id: string }>

export default function AttendanceDetailPage({ params }: { params: Params }) {
  const unwrappedParams = params instanceof Promise ? use(params) : params
  const sessionId = unwrappedParams.id
  const router = useRouter()
  const { toast } = useToast()

  const [session, setSession] = useState<AttendanceSession | null>(null)
  const [clubName, setClubName] = useState("")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithProfile[]>([])
  const [allMembers, setAllMembers] = useState<{id: string, profile: Profile}[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // 출석 세션 및 출석 기록 가져오기
  useEffect(() => {
    async function fetchSessionData() {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast({
            title: "로그인 필요",
            description: "출석 정보를 확인하려면 로그인이 필요합니다.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        // 세션 정보 가져오기
        const { data: sessionData, error: sessionError } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError) throw sessionError
        setSession(sessionData)

        // 클럽 정보 가져오기
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('name')
          .eq('id', sessionData.club_id)
          .single()

        if (clubError) throw clubError
        setClubName(clubData.name)

        // 사용자의 관리자 여부 확인
        const { data: adminData, error: adminError } = await supabase
          .from('club_members')
          .select('*')
          .eq('club_id', sessionData.club_id)
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle()

        const { data: creatorData, error: creatorError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', sessionData.club_id)
          .eq('created_by', user.id)
          .maybeSingle()

        setIsAdmin(!!adminData || !!creatorData)

        // 동아리 모든 멤버 가져오기
        const { data: membersData, error: membersError } = await supabase
          .from('club_members')
          .select(`
            id,
            user_id,
            profile:profiles(*)
          `)
          .eq('club_id', sessionData.club_id)

        if (membersError) throw membersError
        setAllMembers(membersData.map(member => ({
          id: member.user_id,
          profile: member.profile as Profile
        })))

        // 출석 기록 가져오기 (profile 정보 포함)
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendances')
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq('session_id', sessionId)

        if (attendanceError) throw attendanceError
        setAttendanceRecords(attendanceData as AttendanceWithProfile[])

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

    fetchSessionData()
  }, [sessionId, toast, router])

  // 상태 변경 처리
  const handleStatusChange = async (userId: string, status: string) => {
    try {
      // 기존 출석 기록 확인
      const existingRecord = attendanceRecords.find(record => record.user_id === userId)
      
      if (existingRecord) {
        // 출석 기록 업데이트
        const { error } = await supabase
          .from('attendances')
          .update({ status })
          .eq('id', existingRecord.id)

        if (error) throw error
      } else {
        // 새 출석 기록 생성
        const { error } = await supabase
          .from('attendances')
          .insert([{
            session_id: sessionId,
            user_id: userId,
            status,
            check_in_time: status !== 'absent' ? new Date().toISOString() : null,
          }])

        if (error) throw error
        
        // 새로운 기록을 상태에 추가하기 위해 데이터 다시 가져오기
        const { data: newRecord, error: fetchError } = await supabase
          .from('attendances')
          .select(`*, profile:profiles(*)`)
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .single()
          
        if (fetchError) throw fetchError
        
        setAttendanceRecords(prev => [...prev, newRecord as AttendanceWithProfile])
      }

      toast({
        title: "출석 상태 변경",
        description: "출석 상태가 업데이트되었습니다.",
      })
      
      // 상태 목록 갱신
      const { data: updatedData, error: updateError } = await supabase
        .from('attendances')
        .select(`*, profile:profiles(*)`)
        .eq('session_id', sessionId)
        
      if (!updateError) {
        setAttendanceRecords(updatedData as AttendanceWithProfile[])
      }
      
    } catch (error: any) {
      toast({
        title: "상태 변경 실패",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // CSV 파일 생성 및 다운로드
  const handleDownload = () => {
  if (!session || !attendanceRecords.length) return
  
  // BOM(Byte Order Mark) 추가하여 UTF-8 인코딩 명시
  const BOM = '\uFEFF';
  
  // CSV 헤더 및 데이터 생성
  const headers = ['이름', '학교', '학과', '상태', '체크인 시간']
  
  const csvData = [
    headers.join(','),
    ...attendanceRecords.map(record => {
      const profile = record.profile
      // 쉼표가 포함된 데이터는 따옴표로 묶어서 처리
      return [
        `"${profile?.full_name || '이름 없음'}"`,
        `"${profile?.school || '-'}"`,
        `"${profile?.department || '-'}"`,
        `"${record.status === 'present' ? '출석' : 
          record.status === 'late' ? '지각' : 
          record.status === 'excused' ? '사유 있음' : '결석'}"`,
        `"${record.check_in_time ? new Date(record.check_in_time).toLocaleString() : '-'}"`
      ].join(',')
    })
  ].join('\n')
  
  // BOM을 포함하여 UTF-8 인코딩 적용
  const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `출석_${clubName}_${session.title}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast({
    title: "출석 내역 다운로드",
    description: "출석 내역이 CSV 파일로 다운로드되었습니다.",
  })
}

  // 현재 멤버의 출석 상태 가져오기
  const getMemberStatus = (userId: string) => {
    const record = attendanceRecords.find(r => r.user_id === userId)
    return record ? record.status : 'absent'
  }
  
  // 출석 상태를 한글로 변환
  const getStatusInKorean = (status: string) => {
    switch(status) {
      case 'present': return '출석'
      case 'late': return '지각'
      case 'excused': return '사유 있음'
      case 'absent': return '결석'
      default: return '알 수 없음'
    }
  }
  
  // 출석 체크인 시간 표시
  const getCheckInTime = (userId: string) => {
    const record = attendanceRecords.find(r => r.user_id === userId)
    if (!record || !record.check_in_time) return '-'
    return new Date(record.check_in_time).toLocaleTimeString()
  }
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-3xl flex justify-center items-center h-[60vh]">
        <p>출석 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>세션 정보를 찾을 수 없음</CardTitle>
            <CardDescription>요청한 출석 세션이 존재하지 않거나 접근 권한이 없습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/clubs')}>동아리 목록으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 출석/총원 카운트 계산
  const attendanceCount = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length
  const totalCount = allMembers.length
  const attendancePercentage = totalCount > 0 ? Math.round((attendanceCount / totalCount) * 100) : 0

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">출석 세션 상세</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>
                {clubName} - {session.title}
              </CardTitle>
              <CardDescription>
                {new Date(session.start_time).toLocaleDateString()} • 출석: {attendanceCount}/{totalCount}명 ({attendancePercentage}%)
                <br/>
                {new Date(session.start_time).toLocaleTimeString()} ~ {new Date(session.end_time).toLocaleTimeString()}
                {session.location && ` • ${session.location}`}
              </CardDescription>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/attendance/${sessionId}/qr`}>
                    <QrCode className="mr-2 h-4 w-4" />
                    QR 코드
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg"
              >
                <div className="mb-3 sm:mb-0">
                  <h3 className="font-medium">{member.profile?.full_name || "이름 없음"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {member.profile?.school} {member.profile?.department} • 
                    체크 시간: {getCheckInTime(member.id)}
                  </p>
                </div>
                {isAdmin ? (
                  <Select
                    value={getMemberStatus(member.id)}
                    onValueChange={(value) => handleStatusChange(member.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">출석</SelectItem>
                      <SelectItem value="late">지각</SelectItem>
                      <SelectItem value="excused">사유 있음</SelectItem>
                      <SelectItem value="absent">결석</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                      getMemberStatus(member.id) === "present"
                        ? "bg-green-100 text-green-800"
                        : getMemberStatus(member.id) === "late"
                          ? "bg-yellow-100 text-yellow-800"
                          : getMemberStatus(member.id) === "excused"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getStatusInKorean(getMemberStatus(member.id))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
