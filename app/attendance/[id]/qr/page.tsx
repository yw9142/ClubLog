"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Download, RefreshCw } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"

type Params = { id: string } | Promise<{ id: string }>

export default function AttendanceQRPage({ params }: { params: Params }) {
  const unwrappedParams = params instanceof Promise ? use(params) : params
  const sessionId = unwrappedParams.id
  const router = useRouter()
  const [qrValue, setQrValue] = useState("")
  const [sessionInfo, setSessionInfo] = useState({
    id: Number.parseInt(sessionId),
    name: "4월 첫째주 모임",
    clubName: "프로그래밍 동아리",
    date: "2025-04-05",
    attendanceCount: 0,
    totalCount: 24,
  })

  useEffect(() => {
    // 실제 구현에서는 API를 통해 세션 정보를 가져와야 함
    // 여기서는 예시로 QR 코드 값을 생성
    const generateQrValue = () => {
      // 실제 구현에서는 서버에서 생성된 고유한 토큰이나 URL을 사용해야 함
      const token = Math.random().toString(36).substring(2, 15)
      const qrData = JSON.stringify({
        sessionId: sessionId,
        token: token,
        timestamp: new Date().toISOString(),
      })
      setQrValue(qrData)
    }

    generateQrValue()

    // QR 코드 자동 갱신 (5분마다)
    const interval = setInterval(generateQrValue, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [sessionId])

  const handleRefreshQR = () => {
    // QR 코드 수동 갱신
    const token = Math.random().toString(36).substring(2, 15)
    const qrData = JSON.stringify({
      sessionId: sessionId,
      token: token,
      timestamp: new Date().toISOString(),
    })
    setQrValue(qrData)
  }

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement
    if (canvas) {
      const url = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = url
      link.download = `attendance-qr-${sessionId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">출석 QR 코드</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {sessionInfo.clubName} - {sessionInfo.name}
          </CardTitle>
          <CardDescription>이 QR 코드를 회원들에게 보여주고 스캔하도록 안내하세요</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            {qrValue && <QRCodeCanvas id="qr-code" value={qrValue} size={250} level="H" includeMargin />}
          </div>
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">QR 코드는 5분마다 자동으로 갱신됩니다.</p>
            <p className="text-sm font-medium mt-2">
              현재 출석: {sessionInfo.attendanceCount}/{sessionInfo.totalCount}명
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleRefreshQR} className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              QR 코드 갱신
            </Button>
            <Button variant="outline" onClick={handleDownloadQR} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              QR 코드 다운로드
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto order-2 sm:order-1">
            뒤로 가기
          </Button>
          <Button
            onClick={() => router.push(`/attendance/${sessionId}`)}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            출석 현황 보기
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
