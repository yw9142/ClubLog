"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthRedirect() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // 로그인 상태면 대시보드로 리다이렉트
        if (session) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("세션 확인 중 오류 발생:", error);
      } finally {
        setIsChecking(false);
      }
    }

    checkSession();
  }, [router]);

  // 세션 체크 중에는 아무것도 렌더링하지 않음
  return null;
}