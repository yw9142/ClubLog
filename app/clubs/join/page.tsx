"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { ClubInvite } from "@/lib/types"

export default function ClubJoinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [clubInfo, setClubInfo] = useState<{ id: string; name: string; description: string | null; } | null>(null)
  const [inviteInfo, setInviteInfo] = useState<ClubInvite | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // 초대 코드가 없는 경우
    if (!code) {
      setError("유효하지 않은 초대 링크입니다. 초대 코드가 필요합니다.")
      setLoading(false)
      return
    }
    
    validateInviteCode()
  }, [code])
  
  // 초대 코드 검증
  const validateInviteCode = async () => {
    try {
      setLoading(true)
      
      // 사용자 인증 상태 확인
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "로그인 필요",
          description: "동아리에 가입하려면 로그인이 필요합니다.",
          variant: "destructive",
        })
        router.push(`/login?returnUrl=${encodeURIComponent(`/clubs/join?code=${code}`)}`)
        return
      }
      
      // 초대 코드로 동아리 정보 조회
      const { data: inviteData, error: inviteError } = await supabase
        .from('club_invites')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()
      
      if (inviteError || !inviteData) {
        setError("유효하지 않은 초대 코드입니다.")
        setLoading(false)
        return
      }
      
      // 초대 코드 만료 확인
      if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
        setError("만료된 초대 코드입니다.")
        setLoading(false)
        return
      }
      
      setInviteInfo(inviteData as ClubInvite)
      
      // 동아리 정보 조회
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('id, name, description')
        .eq('id', inviteData.club_id)
        .single()
      
      if (clubError || !clubData) {
        setError("동아리 정보를 찾을 수 없습니다.")
        setLoading(false)
        return
      }
      
      // 이미 멤버인지 확인
      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', clubData.id)
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (memberData) {
        setError("이미 이 동아리의 멤버입니다.")
        setLoading(false)
        return
      }
      
      setClubInfo(clubData)
      setLoading(false)
    } catch (error) {
      console.error("초대 코드 검증 오류:", error)
      setError("초대 코드 검증 중 오류가 발생했습니다.")
      setLoading(false)
    }
  }
  
  // 동아리 가입 처리
  const handleJoinClub = async () => {
    if (!clubInfo || !inviteInfo) return
    
    try {
      setJoining(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "로그인 필요",
          description: "동아리에 가입하려면 로그인이 필요합니다.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }
      
      // 동아리 멤버로 추가
      const { error: joinError } = await supabase
        .from('club_members')
        .insert([
          {
            club_id: clubInfo.id,
            user_id: user.id,
            role: 'member'
          }
        ])
      
      if (joinError) {
        throw joinError
      }
      
      toast({
        title: "가입 완료",
        description: `${clubInfo.name} 동아리에 성공적으로 가입했습니다.`,
      })
      
      router.push(`/clubs/${clubInfo.id}`)
    } catch (error: any) {
      console.error("동아리 가입 오류:", error)
      toast({
        title: "가입 실패",
        description: error.message || "동아리 가입 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setJoining(false)
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl flex justify-center items-center h-[70vh]">
        <p>초대 정보를 확인하는 중...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>초대 링크 오류</CardTitle>
            <CardDescription>동아리 초대 링크에 문제가 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={() => router.push("/clubs")}>동아리 목록으로</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>동아리 초대</CardTitle>
          <CardDescription>아래 동아리의 초대를 받았습니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{clubInfo?.name}</h3>
            <p className="text-muted-foreground mt-1">{clubInfo?.description || "설명 없음"}</p>
          </div>
          <p>이 동아리에 가입하시겠습니까?</p>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => router.push("/clubs")}>취소</Button>
          <Button onClick={handleJoinClub} disabled={joining}>
            {joining ? "가입 중..." : "동아리 가입하기"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}