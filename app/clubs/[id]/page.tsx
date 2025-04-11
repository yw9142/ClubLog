"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { CalendarDays, Copy, QrCode, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Club, ClubMember, Profile, AttendanceSession } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function ClubDetailPage({ params }: { params: { id: string } }) {
  const clubId = params.id
  const [club, setClub] = useState<Club | null>(null)
  const [role, setRole] = useState<string>("")
  const [memberCount, setMemberCount] = useState(0)
  const [members, setMembers] = useState<(ClubMember & { profile: Profile })[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteLink, setInviteLink] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchClubDetails() {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast({
            title: "로그인 필요",
            description: "동아리 정보를 보려면 로그인이 필요합니다.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        // 동아리 정보 가져오기
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single()

        if (clubError) throw clubError
        setClub(clubData)

        // 사용자 역할 확인
        const { data: membership, error: membershipError } = await supabase
          .from('club_members')
          .select('role')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .single()

        if (membershipError && membershipError.code !== 'PGRST116') { // PGRST116는 결과가 없을 때 오류 코드
          throw membershipError
        }

        setRole(membership?.role === 'admin' ? '관리자' : '회원')

        // 멤버 수 가져오기
        const { count, error: countError } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', clubId)

        if (countError) throw countError
        setMemberCount(count || 0)

        // 동아리 멤버 목록 가져오기
        const { data: memberData, error: memberError } = await supabase
          .from('club_members')
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq('club_id', clubId)

        if (memberError) throw memberError
        setMembers(memberData as any)

        // 출석 세션 목록 가져오기
        const { data: sessionData, error: sessionError } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('club_id', clubId)
          .order('start_time', { ascending: false })

        if (sessionError) throw sessionError
        setSessions(sessionData)

        // 초대 링크 생성 (실제로는 초대 링크 생성 로직이 필요함)
        setInviteLink(`${window.location.origin}/clubs/join?id=${clubId}`)

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

    fetchClubDetails()
  }, [clubId, toast, router])

  // 초대 링크 복사 함수
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast({
      title: "링크 복사됨",
      description: "초대 링크가 클립보드에 복사되었습니다.",
    })
  }

  const isAdmin = role === "관리자"

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex justify-center items-center h-[70vh]">
        <p>동아리 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex justify-center items-center h-[70vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">동아리를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">요청한 동아리가 존재하지 않거나 접근 권한이 없습니다.</p>
          <Button asChild>
            <Link href="/clubs">동아리 목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{club.name}</h1>
          <p className="text-muted-foreground">{club.description}</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <Button asChild>
                <Link href={`/clubs/${clubId}/manage`}>관리</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/attendance/create?clubId=${clubId}`}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  출석 세션 생성
                </Link>
              </Button>
            </>
          )}
          <Button variant="outline" asChild>
            <Link href={`/attendance/scan?clubId=${clubId}`}>
              <QrCode className="mr-2 h-4 w-4" />
              출석 체크
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">멤버</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
            <p className="text-xs text-muted-foreground">가입한 멤버 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">출석 세션</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">생성된 출석 세션 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">내 역할</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{role || "게스트"}</div>
            <p className="text-xs text-muted-foreground">동아리 내 역할</p>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>초대 링크</CardTitle>
            <CardDescription>이 링크를 공유하여 새로운 멤버를 초대하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input value={inviteLink} readOnly className="flex-1" />
              <Button variant="outline" size="icon" className="shrink-0" onClick={copyInviteLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="members">
        <TabsList className="mb-4 w-full flex">
          <TabsTrigger value="members" className="flex-1">
            멤버
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1">
            출석 세션
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>멤버 목록</CardTitle>
              <CardDescription>동아리에 가입한 멤버 목록</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="mb-2 sm:mb-0">
                        <h3 className="font-medium">{member.profile?.full_name || "이름 없음"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {member.profile?.email} • {member.role === 'admin' ? '관리자' : '회원'} • 가입일: {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isAdmin && member.role !== "admin" && (
                        <Button variant="outline" size="sm" className="self-start sm:self-auto" asChild>
                          <Link href={`/clubs/${clubId}/manage`}>관리</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">아직 멤버가 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>출석 세션</CardTitle>
              <CardDescription>생성된 출석 세션 목록</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="mb-2 sm:mb-0">
                        <h3 className="font-medium">{session.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.start_time).toLocaleDateString()} {new Date(session.start_time).toLocaleTimeString()} 
                          ~ {new Date(session.end_time).toLocaleTimeString()}
                          {session.location && ` • ${session.location}`}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="self-start sm:self-auto" asChild>
                        <Link href={`/attendance/${session.id}`}>상세보기</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">아직 생성된 출석 세션이 없습니다.</p>
                  {isAdmin && (
                    <Button className="mt-4" asChild>
                      <Link href={`/attendance/create?clubId=${clubId}`}>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        출석 세션 생성
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}
