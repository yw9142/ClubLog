"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { use, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Download } from "lucide-react"

type Params = { id: string } | Promise<{ id: string }>

export default function AttendanceDetailPage({ params }: { params: Params }) {
  const unwrappedParams = params instanceof Promise ? use(params) : params
  const sessionId = unwrappedParams.id
  const router = useRouter()
  const { toast } = useToast()

  // 실제 구현에서는 API를 통해 데이터를 가져와야 함
  const sessionInfo = {
    id: Number.parseInt(sessionId),
    name: "4월 첫째주 모임",
    clubName: "프로그래밍 동아리",
    date: "2025-04-05",
    attendanceCount: 20,
    totalCount: 24,
    isAdmin: true, // 관리자 여부
  }

  const attendanceRecords = [
    { id: 1, name: "홍길동", status: "출석", time: "14:00:23" },
    { id: 2, name: "김철수", status: "출석", time: "14:01:45" },
    { id: 3, name: "이영희", status: "출석", time: "14:02:12" },
    { id: 4, name: "박지민", status: "지각", time: "14:15:33" },
    { id: 5, name: "최유진", status: "결석", time: "-" },
    { id: 6, name: "정민수", status: "출석", time: "14:05:21" },
  ]

  const [selectedStatus, setSelectedStatus] = useState<Record<number, string>>(
    attendanceRecords.reduce((acc, record) => ({ ...acc, [record.id]: record.status }), {}),
  )

  const handleStatusChange = (memberId: number, status: string) => {
    setSelectedStatus((prev) => ({ ...prev, [memberId]: status }))

    // 실제 구현에서는 API 호출로 상태 변경
    toast({
      title: "출석 상태 변경",
      description: "출석 상태가 변경되었습니다.",
    })
  }

  const handleDownload = () => {
    // 실제 구현에서는 CSV 파일 생성 및 다운로드 로직
    toast({
      title: "출석 내역 다운로드",
      description: "출석 내역이 다운로드되었습니다.",
    })
  }

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
                {sessionInfo.clubName} - {sessionInfo.name}
              </CardTitle>
              <CardDescription>
                {sessionInfo.date} • 출석: {sessionInfo.attendanceCount}/{sessionInfo.totalCount}명 (
                {Math.round((sessionInfo.attendanceCount / sessionInfo.totalCount) * 100)}%)
              </CardDescription>
            </div>
            {sessionInfo.isAdmin && (
              <div className="flex space-x-2 mt-4 md:mt-0">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceRecords.map((record) => (
              <div
                key={record.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg"
              >
                <div className="mb-3 sm:mb-0">
                  <h3 className="font-medium">{record.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {record.time !== "-" ? `체크 시간: ${record.time}` : "미출석"}
                  </p>
                </div>
                {sessionInfo.isAdmin ? (
                  <Select
                    value={selectedStatus[record.id]}
                    onValueChange={(value) => handleStatusChange(record.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="출석">출석</SelectItem>
                      <SelectItem value="지각">지각</SelectItem>
                      <SelectItem value="결석">결석</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
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
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
