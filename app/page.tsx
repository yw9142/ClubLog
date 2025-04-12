import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CheckCircle, QrCode, Users } from "lucide-react"

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">동아리 출석 체크</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-blue-800">QR 코드로 간편한 동아리 출석 관리</h2>
          <p className="text-xl text-gray-600 mb-8">
            동아리 활동의 출석을 QR 코드를 이용하여 간편하게 기록하고, 관리하며, 통계를 제공하는 서비스
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">시작하기</Link>
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <QrCode className="w-12 h-12 text-blue-600 mb-2" />
              <CardTitle>QR 코드 출석 체크</CardTitle>
              <CardDescription>간편한 QR 코드 스캔으로 출석을 기록하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                관리자가 생성한 QR 코드를 회원이 스캔하여 출석을 체크합니다. 빠르고 정확한 출석 관리가 가능합니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-12 h-12 text-blue-600 mb-2" />
              <CardTitle>동아리 관리</CardTitle>
              <CardDescription>동아리 생성 및 멤버 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                동아리를 생성하고 초대 링크를 통해 멤버를 초대할 수 있습니다. 동아리 관리자는 멤버 목록을 확인하고
                관리할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-blue-600 mb-2" />
              <CardTitle>출석 통계</CardTitle>
              <CardDescription>출석 기록 및 통계 확인</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                개인 및 동아리 전체의 출석 기록을 확인하고 통계를 볼 수 있습니다. 관리자는 출석 내역을 다운로드할 수
                있습니다.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="bg-gray-50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© 2025 동아리 출석 체크 서비스. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
