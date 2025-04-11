import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download } from "lucide-react"

export default function StatisticsPage() {
  // 실제 구현에서는 API를 통해 데이터를 가져와야 함
  const clubs = [
    { id: 1, name: "프로그래밍 동아리" },
    { id: 2, name: "영어 회화 모임" },
    { id: 3, name: "독서 토론 모임" },
  ]

  const personalStats = [
    { clubId: 1, clubName: "프로그래밍 동아리", attendanceRate: 90, totalSessions: 10, attended: 9 },
    { clubId: 2, clubName: "영어 회화 모임", attendanceRate: 80, totalSessions: 10, attended: 8 },
    { clubId: 3, clubName: "독서 토론 모임", attendanceRate: 100, totalSessions: 8, attended: 8 },
  ]

  const clubStats = {
    id: 1,
    name: "프로그래밍 동아리",
    overallRate: 85,
    totalSessions: 10,
    memberStats: [
      { id: 1, name: "홍길동", attendanceRate: 90, attended: 9 },
      { id: 2, name: "김철수", attendanceRate: 80, attended: 8 },
      { id: 3, name: "이영희", attendanceRate: 100, attended: 10 },
      { id: 4, name: "박지민", attendanceRate: 70, attended: 7 },
      { id: 5, name: "최유진", attendanceRate: 90, attended: 9 },
    ],
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
            <CardContent className="h-80 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p>차트 영역 (실제 구현 시 차트 라이브러리 사용)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="club">
          <div className="flex flex-col sm:flex-row items-center mb-6 gap-4">
            <div className="flex-1 max-w-xs w-full">
              <Select defaultValue="1">
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
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              통계 다운로드
            </Button>
          </div>

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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">최고 출석률</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">100%</div>
                <p className="text-xs text-muted-foreground">이영희</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">최저 출석률</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">70%</div>
                <p className="text-xs text-muted-foreground">박지민</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>멤버별 출석률</CardTitle>
                <CardDescription>동아리 멤버 개인별 출석 현황</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>세션별 출석률</CardTitle>
                <CardDescription>각 세션별 출석 현황</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>차트 영역 (실제 구현 시 차트 라이브러리 사용)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
