"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Plus, Search, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Club, ClubMember } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

export default function ClubsPage() {
  const [clubs, setClubs] = useState<(Club & { memberCount: number; role: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function fetchClubs() {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast({
            title: "로그인 필요",
            description: "동아리 목록을 보려면 로그인이 필요합니다.",
            variant: "destructive",
          })
          return
        }

        // 사용자가 속한 동아리 멤버십 정보 가져오기
        const { data: memberships, error: membershipError } = await supabase
          .from('club_members')
          .select('*, club:clubs(*)')
          .eq('user_id', user.id)

        if (membershipError) throw membershipError

        // 각 동아리의 멤버 수 계산
        const clubsWithDetails = await Promise.all((memberships || []).map(async (membership) => {
          const club = membership.club as Club
          
          // 동아리 멤버 수 계산
          const { count: memberCount, error: countError } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id)
          
          if (countError) throw countError
          
          return {
            ...club,
            memberCount: memberCount || 0,
            role: membership.role === 'admin' ? '관리자' : '회원'
          }
        }))

        setClubs(clubsWithDetails)
      } catch (error: any) {
        toast({
          title: "동아리 목록 로딩 실패",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClubs()
  }, [toast])

  // 검색어에 따라 동아리 필터링
  const filteredClubs = clubs.filter(
    club => club.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (club.description && club.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
          <Input 
            type="search" 
            placeholder="동아리 검색..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>동아리 정보를 불러오는 중...</p>
        </div>
      ) : filteredClubs.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((club) => (
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
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">가입한 동아리가 없습니다.</p>
          <Button asChild>
            <Link href="/clubs/create">
              <Plus className="mr-2 h-4 w-4" />
              새 동아리 만들기
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
