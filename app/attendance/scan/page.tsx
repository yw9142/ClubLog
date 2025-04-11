"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Camera, CameraOff } from "lucide-react"

export default function ScanQRPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clubId = searchParams.get("clubId")
  const { toast } = useToast()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setScanning(true)
          setCameraError(false)
        }
      } catch (error) {
        console.error("카메라 접근 오류:", error)
        setCameraError(true)
        setScanning(false)
      }
    }

    if (!scanned) {
      startCamera()
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [scanned])

  useEffect(() => {
    if (!scanning || scanned || !videoRef.current || !canvasRef.current) return

    const checkQRCode = () => {
      if (!videoRef.current || !canvasRef.current || scanned) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight
        canvas.width = video.videoWidth
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // 실제 구현에서는 여기서 QR 코드 디코딩 라이브러리 사용 (예: jsQR)
        // 여기서는 시뮬레이션을 위해 5초 후 성공으로 처리
        setTimeout(() => {
          if (!scanned) {
            handleSuccessfulScan()
          }
        }, 5000)
      }
    }

    const intervalId = setInterval(checkQRCode, 500)

    return () => {
      clearInterval(intervalId)
    }
  }, [scanning, scanned])

  const handleSuccessfulScan = () => {
    setScanned(true)
    setScanning(false)

    // 실제 구현에서는 스캔된 QR 코드 데이터를 서버로 전송하여 출석 처리
    toast({
      title: "출석 체크 성공",
      description: "출석이 정상적으로 처리되었습니다.",
    })

    // 스트림 중지
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const handleScanAgain = () => {
    setScanned(false)
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">QR 코드 스캔</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>출석 체크</CardTitle>
          <CardDescription>관리자가 보여주는 QR 코드를 스캔하여 출석을 체크하세요</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {cameraError ? (
            <div className="text-center p-4 sm:p-8 border rounded-lg bg-gray-50 w-full">
              <CameraOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">카메라를 사용할 수 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                카메라 접근 권한을 확인하거나 다른 기기에서 시도해보세요.
              </p>
              <Button onClick={() => window.location.reload()}>다시 시도</Button>
            </div>
          ) : scanned ? (
            <div className="text-center p-4 sm:p-8 border rounded-lg bg-green-50 w-full">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">출석 체크 완료!</h3>
              <p className="text-sm text-muted-foreground mb-4">출석이 성공적으로 처리되었습니다.</p>
              <Button onClick={handleScanAgain}>다시 스캔하기</Button>
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-sm aspect-square mb-4 bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-white/50 rounded-lg"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-blue-500 rounded-lg"></div>
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground mb-2">QR 코드를 프레임 안에 위치시키세요</p>
              <div className="flex items-center">
                <Camera className="h-4 w-4 mr-2 text-blue-600 animate-pulse" />
                <span className="text-sm font-medium">스캔 중...</span>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => router.push("/attendance")}>
            출석 기록 보기
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
