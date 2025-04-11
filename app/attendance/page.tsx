import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Download, Search } from "lucide-react"

export default function AttendancePage() {
  // 실제 구현에서는 API를 통해 데이터를 가져와야 함
  const attendanceRecords = [
    { id: 1, clubName: "프로그래밍 동아리", sessionName: "4월 첫째주 모임", date: "2025-04-05", status: "출석" },
    { id: 2, clubName: "영어 회화 모임", sessionName: "4월 첫째주 모임", date: "2025-04-06", status: "결석" },
    { id: 3, clubName: "독서 토론 모임", sessionName: "4월 첫째주 모임", date: "2025-04-07", status: "출석" },
    { id: 4, clubName: "프로그래밍 동아리", sessionName: "4월 둘째주 모임", date: "2025-04-12", status: "출석" },
    { id: 5, clubName: "영어 회화 모임", sessionName: "4월 둘째주 모임", date: "2025-04-13", status: "출석" },
    { id: 6, clubName: "독서 토론 모임", sessionName: "4월 둘째주 모임", date: "2025-04-14", status: "지각" },
  ]

  const sessions = [
    {
      id: 1,
      clubName: "프로그래밍 동아리",
      name: "4월 첫째주 모임",
      date: "2025-04-05",
      attendanceCount: 20,
      totalCount: 24,
    },
    {
      id: 2,
      clubName: "영어 회화 모임",
      name: "4월 첫째주 모임",
      date: "2025-04-06",
      attendanceCount: 12,
      totalCount: 15,
    },
    {
      id: 3,
      clubName: "독서 토론 모임",
      name: "4월 첫째주 모임",
      date: "2025-04-07",
      attendanceCount: 10,
      totalCount: 12,
    },
    {
      id: 4,
      clubName: "프로그래밍 동아리",
      name: "4월 둘째주 모임",
      date: "2025-04-12",
      attendanceCount: 18,
      totalCount: 24,
    },
    {
      id: 5,
      clubName: "영어 회화 모임",
      name: "4월 둘째주 모임",
      date: "2025-04-13",
      attendanceCount: 14,
      totalCount: 15,
    },
    {
      id: 6,
      clubName: "독서 토론 모임",
      name: "4월 둘째주 모임",
      date: "2025-04-14",
      attendanceCount: 11,
      totalCount: 12,
    },
  ]

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
          <Input type="search" placeholder="출석 기록 검색..." className="pl-8" />
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
              <div className="space-y-4">
                {attendanceRecords.map((record) => (
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
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.status}
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {sessions.map((session) => (
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
                        {Math.round((session.attendanceCount / session.totalCount) * 100)}%)
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
