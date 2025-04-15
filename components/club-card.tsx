"use client";

import { useId, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { animate } from "motion/react";
import { Club } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useHoverAnimation } from "@/hooks/use-animation";

interface ClubCardProps {
  club: Club;
  index: number;
  variant?: "default" | "compact";
}

export function ClubCard({ club, index, variant = "default" }: ClubCardProps) {
  const cardId = useId();
  const hoverRef = useHoverAnimation(1.03);
  
  // 카드가 처음 렌더링될 때 애니메이션 효과
  useEffect(() => {
    const element = document.getElementById(`club-card-${cardId}`);
    if (element) {
      animate(element, 
        { opacity: [0, 1], y: [20, 0] }, 
        { 
          delay: index * 0.1, // 카드마다 시차를 두어 순차적으로 나타나도록 함
          duration: 0.4, 
          easing: [0.25, 1, 0.5, 1] 
        }
      );
    }
  }, [cardId, index]);

  return (
    <Link href={`/clubs/${club.id}`} className="block h-full">
      <Card 
        id={`club-card-${cardId}`}
        className={`h-full overflow-hidden transition-colors hover:border-primary ${variant === "compact" ? "p-3" : ""}`}
        // @ts-ignore - hoverRef는 HTMLElement를 반환하므로
        ref={hoverRef}
      >
        <CardHeader className={`${variant === "compact" ? "p-2" : ""}`}>
          <div className="flex items-center gap-3">
            {club.logo_url ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-md">
                <Image
                  src={club.logo_url}
                  alt={`${club.name} 로고`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                {club.name.substring(0, 2)}
              </div>
            )}
            <div>
              <h3 className="font-medium">{club.name}</h3>
              {club.category && (
                <Badge variant="outline" className="mt-1">
                  {club.category}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {variant === "default" && (
          <>
            <CardContent className="px-6 py-2">
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {club.description || "설명 없음"}
              </p>
            </CardContent>
            
            <CardFooter className="px-6 py-3">
              <div className="flex w-full items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  멤버 {club.member_count || 0}명
                </div>
                <span className="text-sm font-medium text-primary">
                  상세보기 &rarr;
                </span>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </Link>
  );
}