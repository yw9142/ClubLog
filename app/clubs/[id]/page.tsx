import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { CalendarDays, Copy, QrCode, Users } from "lucide-react"

export default function ClubDetailPage({ params }: { params: { id: string } }) {
  const clubId = params.id

  // 실제 구현에서는 API를 통해 데이터를 가져와야 함
  const club = {
    id: Number.parseInt(clubId),
    name: "프로그래밍 동아리",
    description:
      "코딩과 프로그래밍에 관심 있는 사람들의 모임입니다. 주 1회 모임을 통해 다양한 프로그래밍 주제에 대해 학습하고 토론합니다.",
    memberCount: 24,
    role: "관리자", // 또는 "회원"
    inviteLink: "https://example.com/invite/abc123",
    members: [
      {
        id: 1,
        name: "홍길동",
        role: "관리자",
        joinedAt: "2025-01-15",
        school: "서울대학교",
        department: "컴퓨터공학과",
      },
      {
        id: 2,
        name: "김철수",
        role: "회원",
        joinedAt: "2025-01-20",
        school: "연세대학교",
        department: "정보통신공학과",
      },
      {
        id: 3,
        name: "이영희",
        role: "회원",
        joinedAt: "2025-02-05",
        school: "고려대학교",
        department: "소프트웨어학과",
      },
    ],
    sessions: [
      { id: 1, name: "4월 첫째주 모임", date: "2025-04-05", attendanceCount: 20 },
      { id: 2, name: "4월 둘째주 모임", date: "2025-04-12", attendanceCount: 18 },
      { id: 3, name: "4월 셋째주 모임", date: "2025-04-19", attendanceCount: 22 },
    ],
  }

  const isAdmin = club.role === "관리자"

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
            <div className="text-2xl font-bold">{club.memberCount}</div>
            <p className="text-xs text-muted-foreground">가입한 멤버 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">출석 세션</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{club.sessions.length}</div>
            <p className="text-xs text-muted-foreground">생성된 출석 세션 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">내 역할</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{club.role}</div>
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
              <Input value={club.inviteLink} readOnly className="flex-1" />
              <Button variant="outline" size="icon" className="shrink-0">
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
              <div className="space-y-4">
                {club.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="mb-2 sm:mb-0">
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {member.school} {member.department} • {member.role} • 가입일: {member.joinedAt}
                      </p>
                    </div>
                    {isAdmin && member.role !== "관리자" && (
                      <Button variant="outline" size="sm" className="self-start sm:self-auto" asChild>
                        <Link href={`/clubs/${clubId}/manage`}>관리</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {club.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="mb-2 sm:mb-0">
                      <h3 className="font-medium">{session.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.date} • 출석: {session.attendanceCount}명
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="self-start sm:self-auto" asChild>
                      <Link href={`/attendance/${session.id}`}>상세보기</Link>
                    </Button>
                  </div>
                ))}
              </div>
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
