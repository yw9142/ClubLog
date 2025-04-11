"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input as ShadInput } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, RefreshCw, Trash2, UserMinus, ShieldCheck, ShieldOff } from "lucide-react"
import { use, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Params = { id: string } | Promise<{ id: string }>

export default function ClubManagePage({ params }: { params: Params }) {
  const unwrappedParams = params instanceof Promise ? use(params) : params
  const clubId = unwrappedParams.id
  const { toast } = useToast()
  const [confirmMemberId, setConfirmMemberId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<"promote" | "demote" | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  // 실제 구현에서는 API를 통해 데이터를 가져와야 함
  const club = {
    id: Number.parseInt(clubId),
    name: "프로그래밍 동아리",
    description:
      "코딩과 프로그래밍에 관심 있는 사람들의 모임입니다. 주 1회 모임을 통해 다양한 프로그래밍 주제에 대해 학습하고 토론합니다.",
    inviteLink: "https://example.com/invite/abc123",
    members: [
      {
        id: 1,
        name: "홍길동",
        role: "관리자",
        joinedAt: "2025-01-15",
        email: "hong@example.com",
        school: "서울대학교",
        department: "컴퓨터공학과",
      },
      {
        id: 2,
        name: "김철수",
        role: "회원",
        joinedAt: "2025-01-20",
        email: "kim@example.com",
        school: "연세대학교",
        department: "정보통신공학과",
      },
      {
        id: 3,
        name: "이영희",
        role: "회원",
        joinedAt: "2025-02-05",
        email: "lee@example.com",
        school: "고려대학교",
        department: "소프트웨어학과",
      },
      {
        id: 4,
        name: "박지민",
        role: "회원",
        joinedAt: "2025-02-10",
        email: "park@example.com",
        school: "서울대학교",
        department: "전기공학과",
      },
      {
        id: 5,
        name: "최유진",
        role: "관리자",
        joinedAt: "2025-03-15",
        email: "choi@example.com",
        school: "한양대학교",
        department: "컴퓨터공학과",
      },
    ],
  }

  const [inviteLink, setInviteLink] = useState(club.inviteLink)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [members, setMembers] = useState(club.members)

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast({
      title: "링크 복사 완료",
      description: "초대 링크가 클립보드에 복사되었습니다.",
    })
  }

  const handleRegenerateInviteLink = async () => {
    setIsGeneratingLink(true)

    try {
      // 실제 구현에서는 API 호출로 새 초대 링크 생성
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 새 링크 생성 시뮬레이션
      const newLink = `https://example.com/invite/${Math.random().toString(36).substring(2, 10)}`
      setInviteLink(newLink)

      toast({
        title: "초대 링크 재생성 완료",
        description: "새로운 초대 링크가 생성되었습니다.",
      })
    } catch (error) {
      toast({
        title: "초대 링크 생성 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleRemoveMember = (memberId: number) => {
    // 실제 구현에서는 API 호출로 멤버 제거
    setMembers(members.filter((member) => member.id !== memberId))

    toast({
      title: "멤버 제거 완료",
      description: "멤버가 동아리에서 제거되었습니다.",
    })
  }

  const openPromoteDialog = (memberId: number) => {
    setConfirmMemberId(memberId)
    setConfirmAction("promote")
    setConfirmDialogOpen(true)
  }

  const openDemoteDialog = (memberId: number) => {
    setConfirmMemberId(memberId)
    setConfirmAction("demote")
    setConfirmDialogOpen(true)
  }

  const handleRoleChange = () => {
    if (confirmMemberId && confirmAction) {
      // 실제 구현에서는 API 호출로 권한 변경
      setMembers(
        members.map((member) =>
          member.id === confirmMemberId ? { ...member, role: confirmAction === "promote" ? "관리자" : "회원" } : member,
        ),
      )

      toast({
        title: confirmAction === "promote" ? "관리자 권한 부여 완료" : "일반 회원으로 변경 완료",
        description:
          confirmAction === "promote"
            ? "선택한 멤버가 관리자로 변경되었습니다."
            : "선택한 멤버가 일반 회원으로 변경되었습니다.",
      })

      setConfirmDialogOpen(false)
      setConfirmMemberId(null)
      setConfirmAction(null)
    }
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
                {members.map((member) => (
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
                      ) : member.id !== 1 ? ( // 첫 번째 관리자(본인)는 변경 불가
                        <Button variant="outline" size="sm" onClick={() => openDemoteDialog(member.id)}>
                          <ShieldOff className="h-4 w-4 mr-2" />
                          회원으로 변경
                        </Button>
                      ) : null}

                      {member.id !== 1 && ( // 본인은 제거 불가
                        <Button variant="outline" size="sm" onClick={() => handleRemoveMember(member.id)}>
                          <UserMinus className="h-4 w-4 mr-2" />
                          제거
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
              <Button variant="destructive" className="w-full sm:w-auto order-2 sm:order-1">
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
