"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Camera, CameraOff } from "lucide-react"
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from "@/lib/supabase"

export default function ScanQRPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clubId = searchParams.get("clubId")
  const sessionId = searchParams.get("session")
  const { toast } = useToast()

  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [processingAttendance, setProcessingAttendance] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // QR 스캐너 초기화
  useEffect(() => {
    if (scanned || scannerRef.current) return

    // 스캐너가 표시될 HTML 요소의 ID
    const qrScannerId = 'html5-qrcode-scanner';
    
    // 스캐너 초기화
    scannerRef.current = new Html5QrcodeScanner(
      qrScannerId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true
      },
      /* verbose= */ false
    );

    // QR 코드 스캐닝 성공 핸들러
    const onScanSuccess = async (decodedText: string, decodedResult: any) => {
      console.log(`QR 코드 스캔 성공: ${decodedText}`, decodedResult);
      
      try {
        // 스캐너 중지
        if (scannerRef.current) {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
        setScanned(true);
        setProcessingAttendance(true);
        
        // QR 코드 데이터 분석
        let url;
        try {
          url = new URL(decodedText);
        } catch (error) {
          throw new Error("유효하지 않은 QR 코드입니다.");
        }
        
        // URL 파라미터 추출
        const params = url.searchParams;
        const scannedSessionId = params.get('session');
        
        if (!scannedSessionId) {
          throw new Error("출석 세션 정보가 없는 QR 코드입니다.");
        }
        
        // 현재 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "로그인 필요",
            description: "출석 체크를 하려면 로그인이 필요합니다.",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }

        // 세션 정보 확인
        const { data: sessionData, error: sessionError } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('id', scannedSessionId)
          .single();
          
        if (sessionError || !sessionData) {
          throw new Error("유효하지 않은 출석 세션입니다.");
        }
        
        // 현재 시간이 출석 세션 시간 내에 있는지 확인
        const now = new Date();
        const startTime = new Date(sessionData.start_time);
        const endTime = new Date(sessionData.end_time);
        
        // 해당 클럽 멤버인지 확인
        const { data: memberData, error: memberError } = await supabase
          .from('club_members')
          .select('*')
          .eq('club_id', sessionData.club_id)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (memberError || !memberData) {
          throw new Error("이 동아리의 멤버가 아닙니다.");
        }
        
        // 출석 상태 결정
        let attendanceStatus = 'absent';
        if (now >= startTime && now <= endTime) {
          // 시작 시간 기준으로 30분 이내면 제시간, 그 이후면 지각
          const lateThreshold = new Date(startTime.getTime() + 30 * 60000); // 30분
          attendanceStatus = now <= lateThreshold ? 'present' : 'late';
        } else if (now < startTime) {
          attendanceStatus = 'present'; // 일찍 온 경우도 출석으로 처리
        } else {
          throw new Error("출석 시간이 지났습니다.");
        }
        
        // 이미 출석했는지 확인
        const { data: existingAttendance, error: existingError } = await supabase
          .from('attendances')
          .select('*')
          .eq('session_id', scannedSessionId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (existingAttendance) {
          throw new Error("이미 출석 처리되었습니다.");
        }
        
        // 출석 기록 저장
        const { error: attendanceError } = await supabase
          .from('attendances')
          .insert([{
            session_id: scannedSessionId,
            user_id: user.id,
            status: attendanceStatus,
            check_in_time: new Date().toISOString(),
          }]);
          
        if (attendanceError) {
          throw new Error("출석 처리 중 오류가 발생했습니다.");
        }
        
        toast({
          title: "출석 체크 성공",
          description: attendanceStatus === 'present' ? 
            "출석이 정상적으로 처리되었습니다." : 
            "지각으로 처리되었습니다.",
        });
        
      } catch (error: any) {
        console.error('출석 처리 오류:', error);
        setScanned(false);
        
        toast({
          title: "출석 체크 실패",
          description: error.message || "QR 코드 처리 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        
        // 스캐너 다시 시작
        setTimeout(() => {
          initScanner();
        }, 2000);
      } finally {
        setProcessingAttendance(false);
      }
    };

    // QR 코드 스캐닝 실패 핸들러
    const onScanFailure = (error: any) => {
      // 실패는 무시 (계속 스캐닝)
      console.log('QR 스캐닝 중...', error);
    };

    // 스캐너 초기화 함수
    const initScanner = () => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          qrScannerId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true
          },
          /* verbose= */ false
        );
        scannerRef.current.render(onScanSuccess, onScanFailure);
        setScanning(true);
      }
    };

    // 스캐너 시작
    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [scanned, toast, router]);

  const handleScanAgain = () => {
    setScanned(false);
  };

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
          {scanned ? (
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
          ) : processingAttendance ? (
            <div className="text-center p-4 sm:p-8 border rounded-lg bg-blue-50 w-full">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">출석 처리 중...</h3>
              <p className="text-sm text-muted-foreground mb-4">잠시만 기다려주세요.</p>
            </div>
          ) : (
            <div id="html5-qrcode-scanner" className="w-full"></div>
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
