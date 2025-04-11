"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Moon, Sun } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // 실제 구현에서는 API를 통해 설정 정보를 가져와야 함
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    pushNotifications: true,
    attendanceReminders: true,
    newClubInvites: true,
  })

  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings({
      ...settings,
      [setting]: value,
    })
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)

    try {
      // 실제 구현에서는 API 호출로 설정 저장
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "설정 저장 완료",
        description: "설정이 성공적으로 저장되었습니다.",
      })
    } catch (error) {
      toast({
        title: "설정 저장 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>테마 설정</CardTitle>
            <CardDescription>앱 테마와 디스플레이 설정을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {settings.darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <Label htmlFor="dark-mode" className="font-medium">
                  다크 모드
                </Label>
              </div>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>알림 및 메시지 수신 설정을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="font-medium">
                  이메일 알림
                </Label>
                <p className="text-sm text-muted-foreground">중요 알림을 이메일로 받습니다</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="font-medium">
                  푸시 알림
                </Label>
                <p className="text-sm text-muted-foreground">앱 푸시 알림을 받습니다</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="attendance-reminders" className="font-medium">
                  출석 알림
                </Label>
                <p className="text-sm text-muted-foreground">동아리 활동 전 출석 알림을 받습니다</p>
              </div>
              <Switch
                id="attendance-reminders"
                checked={settings.attendanceReminders}
                onCheckedChange={(checked) => handleSettingChange("attendanceReminders", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-club-invites" className="font-medium">
                  동아리 초대 알림
                </Label>
                <p className="text-sm text-muted-foreground">새로운 동아리 초대 알림을 받습니다</p>
              </div>
              <Switch
                id="new-club-invites"
                checked={settings.newClubInvites}
                onCheckedChange={(checked) => handleSettingChange("newClubInvites", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "저장 중..." : "설정 저장"}
          </Button>
        </div>
      </div>
    </div>
  )
}
