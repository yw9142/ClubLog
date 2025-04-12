"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input as ShadInput } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, RefreshCw, Trash2, UserMinus, ShieldCheck, ShieldOff } from "lucide-react"
import { use, useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Params = { id: string } | Promise<{ id: string }>

interface ClubMember {
  id: string
  name: string
  role: string
  joinedAt: string
  email: string
  school: string
  department: string
}

interface ClubData {
  id: string
  name: string
  description: string
  inviteLink: string
  members: ClubMember[]
}

export default function ClubManagePage({ params }: { params: Params }) {
  const unwrappedParams = params instanceof Promise ? use(params) : params
  const clubId = unwrappedParams.id
  const { toast } = useToast()
  const router = useRouter()
  const [confirmMemberId, setConfirmMemberId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<"promote" | "demote" | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [club, setClub] = useState<ClubData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [inviteLink, setInviteLink] = useState("")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  // 데이터 가져오기
  useEffect(() => {
    async function fetchClubData() {
      try {
        setIsLoading(true)
        
        // 현재 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error("로그인되지 않은 사용자")
          router.push("/login")
          return
        }
        
        setCurrentUserId(user.id)
        
        // 동아리 정보 가져오기
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single()
        
        if (clubError) {
          console.error("동아리 정보 조회 오류:", clubError)
          throw clubError
        }
        
        // 동아리 멤버 정보 가져오기
        const { data: membersData, error: membersError } = await supabase
          .from('club_members')
          .select(`
            id,
            role,
            joined_at,
            profiles (
              id,
              full_name,
              email,
              school,
              department
            )
          `)
          .eq('club_id', clubId)
        
        if (membersError) {
          console.error("동아리 멤버 조회 오류:", membersError)
          throw membersError
        }
        
        // 현재 사용자가 관리자인지 확인
        const isAdmin = membersData.some(
          member => member.profiles.id === user.id && (member.role === 'admin' || clubData.created_by === user.id)
        )
        
        if (!isAdmin) {
          toast({
            title: "권한 없음",
            description: "이 페이지에 접근할 권한이 없습니다.",
            variant: "destructive",
          })
          router.push(`/clubs/${clubId}`)
          return
        }
        
        // 초대 링크 생성 (실제로는 더 안전한 방법으로 구현해야 함)
        const generatedInviteLink = `${window.location.origin}/clubs/join?code=${clubId}`
        
        // 멤버 정보 포맷팅
        const formattedMembers: ClubMember[] = membersData.map(member => ({
          id: member.profiles.id,
          name: member.profiles.full_name || '이름 없음',
          role: member.role === 'admin' ? '관리자' : '회원',
          joinedAt: new Date(member.joined_at).toLocaleDateString('ko-KR'),
          email: member.profiles.email || '',
          school: member.profiles.school || '',
          department: member.profiles.department || '',
        }))
        
        setClub({
          id: clubData.id,
          name: clubData.name,
          description: clubData.description || '',
          inviteLink: generatedInviteLink,
          members: formattedMembers,
        })
        
        setInviteLink(generatedInviteLink)
      } catch (error: any) {
        toast({
          title: "데이터 로딩 실패",
          description: error.message || "데이터를 불러오는 도중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchClubData()
  }, [clubId, router, toast])

  // 초대 링크 복사
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast({
      title: "링크 복사 완료",
      description: "초대 링크가 클립보드에 복사되었습니다.",
    })
  }

  // 새 초대 링크 생성 (실제 데이터베이스와 연동)
  const handleRegenerateInviteLink = async () => {
    setIsGeneratingLink(true)

    try {
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "로그인 필요",
          description: "초대 링크를 생성하려면 로그인이 필요합니다.",
          variant: "destructive",
        })
        return
      }
      
      // 고유한 초대 코드 생성 (더 명확하고 고유한 형식)
      const randomPart = Math.random().toString(36).substring(2, 8);
      const inviteCode = `${clubId.slice(0, 8)}-${randomPart}`;
      
      console.log("생성할 초대 코드:", inviteCode);
      
      // 기존 초대 코드 비활성화
      await supabase
        .from('club_invites')
        .update({ is_active: false })
        .eq('club_id', clubId)
      
      // 새 초대 코드 생성
      const { data: inviteData, error: inviteError } = await supabase
        .from('club_invites')
        .insert([
          {
            club_id: clubId,
            code: inviteCode,
            created_by: user.id,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후 만료
            is_active: true
          }
        ])
        .select()
        .single()
      
      if (inviteError) {
        console.error("초대 코드 생성 오류:", inviteError);
        throw inviteError;
      }
      
      console.log("생성된 초대 정보:", inviteData);
      
      // 초대 링크 업데이트
      const newLink = `${window.location.origin}/clubs/join?code=${inviteCode}`;
      setInviteLink(newLink);

      toast({
        title: "초대 링크 재생성 완료",
        description: "새로운 초대 링크가 생성되었습니다.",
      })
    } catch (error: any) {
      console.error("초대 링크 생성 오류:", error);
      toast({
        title: "초대 링크 생성 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLink(false)
    }
  }

  // 멤버 제거
  const handleRemoveMember = async (memberId: string) => {
    try {
      // 데이터베이스에서 멤버 제거
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', memberId)
        
      if (error) {
        console.error('멤버 제거 오류:', error)
        throw error
      }
      
      // 멤버 목록 업데이트
      if (club) {
        setClub({
          ...club,
          members: club.members.filter(member => member.id !== memberId)
        })
      }

      toast({
        title: "멤버 제거 완료",
        description: "멤버가 동아리에서 제거되었습니다.",
      })
    } catch (error: any) {
      toast({
        title: "멤버 제거 실패",
        description: error.message || "멤버를 제거하는 도중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 관리자 승급 다이얼로그 열기
  const openPromoteDialog = (memberId: string) => {
    setConfirmMemberId(memberId)
    setConfirmAction("promote")
    setConfirmDialogOpen(true)
  }

  // 일반 회원으로 강등 다이얼로그 열기
  const openDemoteDialog = (memberId: string) => {
    setConfirmMemberId(memberId)
    setConfirmAction("demote")
    setConfirmDialogOpen(true)
  }

  // 동아리 삭제 다이얼로그 열기
  const openDeleteDialog = () => {
    setDeleteConfirmText("")
    setConfirmDeleteDialogOpen(true)
  }

  // 역할 변경 처리
  const handleRoleChange = async () => {
    if (confirmMemberId && confirmAction && club) {
      try {
        // 데이터베이스에서 역할 변경
        const { error } = await supabase
          .from('club_members')
          .update({ role: confirmAction === "promote" ? 'admin' : 'member' })
          .eq('club_id', clubId)
          .eq('user_id', confirmMemberId)
          
        if (error) {
          console.error('역할 변경 오류:', error)
          throw error
        }
        
        // 멤버 목록 업데이트
        setClub({
          ...club,
          members: club.members.map(member => 
            member.id === confirmMemberId 
              ? { ...member, role: confirmAction === "promote" ? "관리자" : "회원" } 
              : member
          )
        })

        toast({
          title: confirmAction === "promote" ? "관리자 권한 부여 완료" : "일반 회원으로 변경 완료",
          description:
            confirmAction === "promote"
              ? "선택한 멤버가 관리자로 변경되었습니다."
              : "선택한 멤버가 일반 회원으로 변경되었습니다.",
        })
      } catch (error: any) {
        toast({
          title: "역할 변경 실패",
          description: error.message || "역할을 변경하는 도중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setConfirmDialogOpen(false)
        setConfirmMemberId(null)
        setConfirmAction(null)
      }
    }
  }

  // 동아리 삭제 처리
  const handleDeleteClub = async () => {
    if (!club || deleteConfirmText !== club.name) {
      toast({
        title: "삭제 실패",
        description: "동아리 이름이 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      // 동아리 삭제
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId)

      if (error) {
        console.error('동아리 삭제 오류:', error)
        throw error
      }

      toast({
        title: "동아리 삭제 완료",
        description: "동아리가 성공적으로 삭제되었습니다.",
      })
      
      // 메인 페이지로 리다이렉트
      router.push('/clubs')
    } catch (error: any) {
      toast({
        title: "동아리 삭제 실패",
        description: error.message || "동아리를 삭제하는 도중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setConfirmDeleteDialogOpen(false)
    }
  }

  // 로딩 중이면 로딩 UI 표시
  if (isLoading || !club) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{club.name} 관리</h1>
          <p className="text-muted-foreground">동아리 설정 및 멤버 관리</p>
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-4 w-full flex">
          <TabsTrigger value="members" className="flex-1">
            멤버 관리
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex-1">
            초대 관리
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">
            동아리 설정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>멤버 목록</CardTitle>
              <CardDescription>동아리에 가입한 멤버를 관리합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {club.members.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    등록된 멤버가 없습니다.
                  </div>
                ) : (
                  club.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="mb-3 sm:mb-0">
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {member.school} {member.department} • {member.role} • 가입일: {member.joinedAt}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {member.role === "회원" ? (
                          <Button variant="outline" size="sm" onClick={() => openPromoteDialog(member.id)}>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            관리자로 변경
                          </Button>
                        ) : member.id !== currentUserId ? ( // 자기 자신은 변경 불가
                          <Button variant="outline" size="sm" onClick={() => openDemoteDialog(member.id)}>
                            <ShieldOff className="h-4 w-4 mr-2" />
                            회원으로 변경
                          </Button>
                        ) : null}

                        {member.id !== currentUserId && ( // 자기 자신은 제거 불가
                          <Button variant="outline" size="sm" onClick={() => handleRemoveMember(member.id)}>
                            <UserMinus className="h-4 w-4 mr-2" />
                            제거
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle>초대 링크</CardTitle>
              <CardDescription>이 링크를 공유하여 새로운 멤버를 초대하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <ShadInput value={inviteLink} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleCopyInviteLink} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleRegenerateInviteLink}
                disabled={isGeneratingLink}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingLink ? "animate-spin" : ""}`} />
                {isGeneratingLink ? "생성 중..." : "새 초대 링크 생성"}
              </Button>
              <div className="text-sm text-muted-foreground mt-2">
                새 초대 링크를 생성하면 기존 링크는 더 이상 사용할 수 없습니다.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>동아리 설정</CardTitle>
              <CardDescription>동아리 정보 및 설정을 관리합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="club-name">동아리 이름</Label>
                <ShadInput id="club-name" defaultValue={club.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club-description">동아리 설명</Label>
                <Textarea id="club-description" defaultValue={club.description} rows={4} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button 
                variant="destructive" 
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={openDeleteDialog}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                동아리 삭제
              </Button>
              <Button className="w-full sm:w-auto order-1 sm:order-2">변경사항 저장</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction === "promote" ? "관리자 권한 부여" : "일반 회원으로 변경"}</DialogTitle>
            <DialogDescription>
              {confirmAction === "promote"
                ? "선택한 멤버에게 관리자 권한을 부여하시겠습니까? 관리자는 동아리 설정, 멤버 관리, 출석 세션 생성 등의 권한을 갖게 됩니다."
                : "선택한 멤버를 일반 회원으로 변경하시겠습니까? 일반 회원은 동아리 관리 권한이 제한됩니다."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="w-full sm:w-auto">
              취소
            </Button>
            <Button onClick={handleRoleChange} className="w-full sm:w-auto">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>동아리 삭제</DialogTitle>
            <DialogDescription>
              동아리를 삭제하면 모든 멤버, 출석 세션, 출석 기록 등이 함께 삭제되며 복구할 수 없습니다.
              <br />
              삭제를 확인하려면 동아리 이름 &quot;{club?.name}&quot;을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-text">동아리 이름 입력</Label>
            <ShadInput
              id="confirm-text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={club?.name}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteDialogOpen(false)} 
              className="w-full sm:w-auto"
            >
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteClub}
              disabled={isDeleting || deleteConfirmText !== club?.name}
              className="w-full sm:w-auto"
            >
              {isDeleting ? "삭제 중..." : "동아리 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {children}
    </label>
  )
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}
