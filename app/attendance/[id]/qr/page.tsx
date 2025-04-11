"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Download, RefreshCw } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { AttendanceSession } from "@/lib/types"

type Params = { id: string } | Promise<{ id: string }>

export default function AttendanceQRPage({ params }: { params: Params }) {
  const unwrappedParams = params instanceof Promise ? use(params) : params
  const sessionId = unwrappedParams.id
  const router = useRouter()
  const [qrValue, setQrValue] = useState("")
  const [session, setSession] = useState<AttendanceSession | null>(null)
  const [clubName, setClubName] = useState("")
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // 세션 정보 및 출석 정보 가져오기
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

        // 클럽 멤버 수 확인
        const { count: memberCount, error: memberCountError } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', sessionData.club_id)

        if (memberCountError) throw memberCountError
        setTotalCount(memberCount || 0)

        // 현재 출석 수 확인
        const { count: attendCount, error: attendCountError } = await supabase
          .from('attendances')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .not('status', 'eq', 'absent')

        if (attendCountError) throw attendCountError
        setAttendanceCount(attendCount || 0)

        // 세션 접근 권한 확인
        const { data: isAdmin, error: adminError } = await supabase
          .from('club_members')
          .select('*')
          .eq('club_id', sessionData.club_id)
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle()

        const { data: isCreator, error: creatorError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', sessionData.club_id)
          .eq('created_by', user.id)
          .maybeSingle()

        if (!isAdmin && !isCreator) {
          toast({
            title: "권한 없음",
            description: "이 세션의 QR 코드를 보려면 관리자 권한이 필요합니다.",
            variant: "destructive",
          })
          router.push(`/clubs/${sessionData.club_id}`)
          return
        }

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

  // QR 코드 생성
  useEffect(() => {
    if (!session) return

    const generateQrValue = () => {
      // 실제 QR 코드 값: 출석 체크를 위한 URL
      // URL에 세션 ID와 서명으로 사용할 토큰을 포함
      const token = Math.random().toString(36).substring(2, 15)
      const baseUrl = window.location.origin
      const checkInUrl = `${baseUrl}/attendance/scan?session=${sessionId}&token=${token}&ts=${Date.now()}`
      setQrValue(checkInUrl)
    }

    generateQrValue()

    // QR 코드 자동 갱신 (5분마다)
    const interval = setInterval(generateQrValue, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [sessionId, session])

  const handleRefreshQR = () => {
    // QR 코드 수동 갱신
    const token = Math.random().toString(36).substring(2, 15)
    const baseUrl = window.location.origin
    const checkInUrl = `${baseUrl}/attendance/scan?session=${sessionId}&token=${token}&ts=${Date.now()}`
    setQrValue(checkInUrl)
  }

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement
    if (canvas) {
      const url = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = url
      const fileName = `출석코드_${clubName}_${session?.title || ''}.png`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl flex justify-center items-center h-[60vh]">
        <p>세션 정보를 불러오는 중...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>세션 정보를 찾을 수 없음</CardTitle>
            <CardDescription>요청한 출석 세션이 존재하지 않거나 접근 권한이 없습니다.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/clubs')}>동아리 목록으로 돌아가기</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">출석 QR 코드</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {clubName} - {session.title}
          </CardTitle>
          <CardDescription>이 QR 코드를 회원들에게 보여주고 스캔하도록 안내하세요</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            {qrValue && <QRCodeCanvas id="qr-code" value={qrValue} size={250} level="H" includeMargin />}
          </div>
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">QR 코드는 5분마다 자동으로 갱신됩니다.</p>
            <p className="text-sm text-muted-foreground">
              {new Date(session.start_time).toLocaleDateString()} {new Date(session.start_time).toLocaleTimeString()} 
              ~ {new Date(session.end_time).toLocaleTimeString()}
              {session.location && ` • ${session.location}`}
            </p>
            <p className="text-sm font-medium mt-2">
              현재 출석: {attendanceCount}/{totalCount}명
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
