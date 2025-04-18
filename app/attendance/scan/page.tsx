"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Camera, CameraOff } from "lucide-react"
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
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking')
  const scannerRef = useRef<any>(null)
  const videoRef = useRef<HTMLDivElement>(null)

  // 카메라 권한 확인 및 스캐너 자동 시작
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as any });
        const permState = permissionStatus.state as 'granted' | 'denied' | 'prompt';
        setCameraPermission(permState);
        
        permissionStatus.onchange = () => {
          const newState = permissionStatus.state as 'granted' | 'denied' | 'prompt';
          setCameraPermission(newState);
          
          // 권한이 변경되어 허용되었을 때 자동으로 스캐너 초기화
          if (newState === 'granted' && !scannerRef.current) {
            // 약간의 지연을 주어 DOM이 업데이트된 후 스캐너 초기화
            setTimeout(() => {
              initQrScanner();
            }, 500);
          }
        };

        // 권한이 이미 허용된 상태라면 자동으로 스캐너 초기화
        if (permState === 'granted') {
          // 약간의 지연을 주어 DOM이 완전히 렌더링된 후 스캐너 초기화
          setTimeout(() => {
            initQrScanner();
          }, 500);
        }
      } catch (error) {
        console.error("카메라 권한 확인 오류:", error);
        // 권한 API가 지원되지 않는 경우 직접 카메라에 접근 시도
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(() => {
            setCameraPermission('granted');
            // 약간의 지연을 주어 DOM이 업데이트된 후 스캐너 초기화
            setTimeout(() => {
              initQrScanner();
            }, 500);
          })
          .catch((err) => {
            console.error("카메라 접근 오류:", err);
            setCameraPermission('denied');
          });
      }
    };
    
    // 컴포넌트가 마운트된 후 카메라 권한 확인
    setTimeout(checkCameraPermission, 300);
    
    // 컴포넌트 언마운트 시 스캐너 정리 - 여기서는 정리 로직을 제거
    // 스캐너 정리는 별도의 useEffect에서 처리
  }, [scanned]);

  // QR 스캐너 초기화
  const initQrScanner = async () => {
    console.log("QR 스캐너 초기화 시작");
    // 이미 스캔 완료되었거나 스캐너가 이미 초기화된 경우 무시
    if (scanned) {
      console.log("이미 스캔되었습니다.");
      return;
    }
    
    // 이전 스캐너가 있으면 정리
    if (scannerRef.current) {
      console.log("이전 스캐너 정리 시작");
      try {
        await scannerRef.current.stop();
        console.log("이전 스캐너 정리 완료");
      } catch (cleanupError) {
        console.error("이전 스캐너 정리 중 오류:", cleanupError);
      } finally {
        scannerRef.current = null;
      }
    }
    
    try {
      // 모바일 환경에서 DOM이 완전히 렌더링 될 때까지 기다림
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 동적으로 html5-qrcode 라이브러리 로드
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // 스캐너 초기화 - ID를 직접 확인
      const elementId = 'html5-qrcode-element';
      const element = document.getElementById(elementId);
      if (!element) {
        console.error('스캐너 요소를 찾을 수 없습니다:', elementId);
        setCameraError(true);
        return;
      }
      
      console.log("QR 스캐너 DOM 요소 찾음:", element);
      
      // 기존 내용 초기화
      element.innerHTML = '';
      
      // 스캐너 생성
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;
      
      try {
        console.log("카메라 스캔 시작 시도");
        
        // 화면 크기에 따른 동적 QR 박스 크기 계산 (최소 180px, 최대 400px, 컨테이너 너비의 80%)
        const containerWidth = element.clientWidth || 300;
        const containerHeight = element.clientHeight || 300;
        const minSize = 180;
        const maxSize = 400;
        
        // 컨테이너의 가로 세로 중 작은 쪽에 맞춰 정사각형 계산
        const smallerDimension = Math.min(containerWidth, containerHeight);
        const qrboxSize = Math.max(minSize, Math.min(maxSize, Math.floor(smallerDimension * 0.8)));
        
        console.log("컨테이너 크기:", containerWidth, "x", containerHeight, "QR박스 크기:", qrboxSize);
        
        try {
          // 모바일 환경에서는 facingMode를 먼저 시도
          console.log("환경 카메라로 시작 시도");
          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: qrboxSize, height: qrboxSize },
              aspectRatio: 1.0
            },
            onScanSuccess,
            onScanFailure
          );
          
          setScanning(true);
          console.log("환경 카메라로 시작 성공");
        } catch (envCameraError) {
          console.error("환경 카메라 시작 오류:", envCameraError);
          
          try {
            // 카메라 장치 목록 가져오기
            console.log("카메라 장치 목록 가져오기 시도");
            const devices = await Html5Qrcode.getCameras();
            console.log("감지된 카메라:", devices);
            
            if (devices && devices.length) {
              // 카메라 시작 - 자동으로 후면 카메라 사용 시도
              let cameraId = devices[0].id; // 기본적으로 첫 번째 카메라
              
              // 후면 카메라 찾기 시도
              const backCamera = devices.find(camera => 
                camera.label.toLowerCase().includes('back') || 
                camera.label.toLowerCase().includes('rear') || 
                camera.label.toLowerCase().includes('환경') || 
                camera.label.toLowerCase().includes('후면')
              );
              
              if (backCamera) {
                cameraId = backCamera.id;
                console.log("후면 카메라 발견:", backCamera.label);
              }
              
              try {
                await scanner.start(
                  cameraId,
                  {
                    fps: 10,
                    qrbox: qrboxSize,
                    aspectRatio: 1.0,
                  },
                  onScanSuccess,
                  onScanFailure
                );
                
                setScanning(true);
                console.log("카메라 시작 성공 - ID:", cameraId);
              } catch (specificCameraError) {
                console.error("특정 카메라 시작 오류:", specificCameraError);
                
                // 특정 카메라 실패 시 사용자 카메라로 시도
                try {
                  console.log("사용자 카메라로 시작 시도");
                  await scanner.start(
                    { facingMode: "user" },
                    {
                      fps: 10,
                      qrbox: { width: qrboxSize, height: qrboxSize },
                      aspectRatio: 1.0
                    },
                    onScanSuccess,
                    onScanFailure
                  );
                  
                  setScanning(true);
                  console.log("사용자 카메라로 시작 성공");
                } catch (userCameraError) {
                  console.error("모든 카메라 시작 실패:", userCameraError);
                  setCameraError(true);
                  
                  // 스캐너 정리
                  if (scannerRef.current) {
                    try {
                      await scannerRef.current.stop();
                    } catch (e) {}
                    scannerRef.current = null;
                  }
                }
              }
            } else {
              throw new Error("감지된 카메라가 없습니다.");
            }
          } catch (devicesError) {
            console.error("카메라 장치 접근 오류:", devicesError);
            
            // 마지막 시도로 사용자 카메라 시도
            try {
              console.log("사용자 카메라로 시작 시도");
              await scanner.start(
                { facingMode: "user" },
                {
                  fps: 10,
                  qrbox: { width: qrboxSize, height: qrboxSize },
                  aspectRatio: 1.0
                },
                onScanSuccess,
                onScanFailure
              );
              
              setScanning(true);
              console.log("사용자 카메라로 시작 성공");
            } catch (userCameraError) {
              console.error("모든 카메라 시작 실패:", userCameraError);
              setCameraError(true);
              
              // 스캐너 정리
              if (scannerRef.current) {
                try {
                  await scannerRef.current.stop();
                } catch (e) {}
                scannerRef.current = null;
              }
            }
          }
        }
      } catch (startError) {
        console.error("카메라 시작 오류:", startError);
        setCameraError(true);
        
        // 스캐너 정리
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch (e) {}
          scannerRef.current = null;
        }
      }
    } catch (error) {
      console.error("QR 스캐너 초기화 오류:", error);
      setCameraError(true);
      scannerRef.current = null;
    }
  };

  // QR 코드 스캔 성공 핸들러
  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    console.log(`QR 코드 스캔 성공: ${decodedText}`, decodedResult);
    
    try {
      // 스캐너 중지 - 비동기 오류 처리 개선
      if (scannerRef.current) {
        try {
          setScanning(false);
          await scannerRef.current.stop();
        } catch (stopError) {
          console.log("스캔 성공 후 스캐너 중지 중 무시된 오류:", stopError);
        } finally {
          scannerRef.current = null;
        }
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("사용자 정보 가져오기 오류:", userError);
        // 세션 갱신 시도
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          // 세션 갱신 실패 시 로그인 페이지로 리다이렉트하지만 현재 페이지는 유지
          toast({
            title: "로그인 세션 만료",
            description: "다시 로그인이 필요합니다.",
            variant: "destructive",
          });
          throw new Error("로그인 세션이 만료되었습니다.");
        }
        
        // 세션 갱신 후 사용자 정보 다시 가져오기
        const { data: { user: refreshedUser } } = await supabase.auth.getUser();
        if (!refreshedUser) {
          throw new Error("로그인이 필요합니다.");
        }
      }
      
      if (!user) {
        toast({
          title: "로그인 필요",
          description: "출석 체크를 하려면 로그인이 필요합니다.",
          variant: "destructive",
        });
        throw new Error("로그인이 필요합니다.");
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
      
      // 인증 관련 오류인 경우 로그인 페이지로 이동하지만 로그아웃은 하지 않음
      if (error.message === "로그인이 필요합니다." || error.message === "로그인 세션이 만료되었습니다.") {
        router.push("/login");
      } else {
        toast({
          title: "출석 체크 실패",
          description: error.message || "QR 코드 처리 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        
        // 스캐너 다시 시작 (오류가 인증 관련이 아닌 경우만)
        if (!error.message.includes("로그인")) {
          setTimeout(() => {
            initQrScanner();
          }, 2000);
        }
      }
    } finally {
      setProcessingAttendance(false);
    }
  };
  
  // QR 코드 스캔 실패 핸들러
  const onScanFailure = (error: any) => {
    // 실패는 무시 (계속 스캐닝)
    console.log('QR 스캐닝 중...', error);
  };
  
  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          // Promise 객체 처리가 아닌 동기적 처리로 변경
          if (typeof scannerRef.current.stop === 'function') {
            // 스캐너 중지 중 오류를 방지하기 위해 상태 체크
            if (scanning) {
              try {
                // stop 메소드를 실행하되 결과를 기다리지 않음
                scannerRef.current.stop().catch(e => {
                  console.log("스캐너 정리 중 무시된 오류:", e.message);
                });
              } catch (e) {
                console.log("스캐너 stop 호출 중 무시된 오류");
              }
            }
          }
        } finally {
          // 항상 스캐너 참조 초기화
          scannerRef.current = null;
          setScanning(false);
        }
      }
    };
  }, [scanning]);

  // 라우터 변경 감지하여 페이지 이탈 시 리소스 정리
  useEffect(() => {
    // 페이지 언마운트 시 실행될 정리 함수
    const handleBeforeUnload = () => {
      if (scannerRef.current) {
        try {
          if (typeof scannerRef.current.stop === 'function') {
            // 비동기 처리 없이 동기적으로 정리
            scannerRef.current.stop().catch(() => {});
          }
        } catch (e) {
          // 오류 무시
        } finally {
          scannerRef.current = null;
        }
      }
    };

    // 페이지 이동 시 리소스 정리
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleScanAgain = () => {
    setScanned(false);
    initQrScanner();
  };

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
    } catch (error) {
      console.error("카메라 권한 요청 오류:", error);
      setCameraPermission('denied');
    }
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
          ) : cameraPermission === 'denied' ? (
            <div className="text-center p-4 sm:p-8 border rounded-lg bg-red-50 w-full">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <CameraOff className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">카메라 접근 거부됨</h3>
              <p className="text-sm text-muted-foreground mb-4">QR 코드를 스캔하려면 카메라 접근 권한이 필요합니다.</p>
              <Button onClick={requestCameraPermission}>카메라 권한 요청</Button>
            </div>
          ) : cameraPermission === 'prompt' ? (
            <div className="text-center p-4 sm:p-8 border rounded-lg bg-yellow-50 w-full">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">카메라 접근 권한 필요</h3>
              <p className="text-sm text-muted-foreground mb-4">QR 코드를 스캔하려면 카메라 접근 권한이 필요합니다.</p>
              <Button onClick={requestCameraPermission}>카메라 권한 요청</Button>
            </div>
          ) : cameraPermission === 'checking' ? (
            <div className="text-center p-4 sm:p-8 border rounded-lg bg-blue-50 w-full">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">카메라 권한 확인 중...</h3>
              <p className="text-sm text-muted-foreground mb-4">잠시만 기다려주세요.</p>
            </div>
          ) : cameraError ? (
            <div className="text-center p-4 sm:p-8 border rounded-lg bg-red-50 w-full">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <CameraOff className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">카메라 오류</h3>
              <p className="text-sm text-muted-foreground mb-4">카메라를 초기화하는 도중 오류가 발생했습니다.</p>
              <Button onClick={() => window.location.reload()}>다시 시도</Button>
            </div>
          ) : (
            <div className="w-full h-96 border rounded overflow-hidden">
              <div id="html5-qrcode-element" className="w-full h-full" style={{
                maxWidth: "100%", 
                height: "100%", 
                display: "block",
                position: "relative"
              }}></div>
            </div>
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
