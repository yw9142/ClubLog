import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Plus, Search, Users } from "lucide-react"

export default function ClubsPage() {
  // 실제 구현에서는 API를 통해 데이터를 가져와야 함
  const clubs = [
    {
      id: 1,
      name: "프로그래밍 동아리",
      description: "코딩과 프로그래밍에 관심 있는 사람들의 모임",
      memberCount: 24,
      role: "관리자",
    },
    { id: 2, name: "영어 회화 모임", description: "영어 회화 실력 향상을 위한 모임", memberCount: 15, role: "회원" },
    { id: 3, name: "독서 토론 모임", description: "다양한 책을 읽고 토론하는 모임", memberCount: 12, role: "회원" },
    {
      id: 4,
      name: "사진 동아리",
      description: "사진 촬영 기술을 공유하고 함께 촬영하는 모임",
      memberCount: 18,
      role: "회원",
    },
  ]

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">동아리</h1>
          <p className="text-muted-foreground">가입한 동아리 목록과 관리</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild>
            <Link href="/clubs/create">
              <Plus className="mr-2 h-4 w-4" />
              동아리 생성
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="동아리 검색..." className="pl-8" />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <Card key={club.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg sm:text-xl">{club.name}</CardTitle>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    club.role === "관리자" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {club.role}
                </div>
              </div>
              <CardDescription className="line-clamp-2">{club.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-1 h-4 w-4" />
                <span>멤버 {club.memberCount}명</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href={`/clubs/${club.id}`}>상세보기</Link>
              </Button>
              {club.role === "관리자" && (
                <Button variant="default" className="w-full sm:w-auto" asChild>
                  <Link href={`/clubs/${club.id}/manage`}>관리</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
