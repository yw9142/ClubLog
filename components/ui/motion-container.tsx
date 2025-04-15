"use client";

import { useRef, useEffect, ReactNode, forwardRef } from "react";
import { useEntranceAnimation, useScrollAnimation } from "@/hooks/use-animation";
import { animate } from "motion/react";

interface MotionContainerProps {
  children: ReactNode;
  animationType?: 'fadeIn' | 'slideUp' | 'scale' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
  enableScroll?: boolean;
  threshold?: number;
}

export const MotionContainer = forwardRef<HTMLDivElement, MotionContainerProps>(
  ({ 
    children, 
    animationType = 'fadeIn',
    delay = 0,
    duration = 0.5,
    className = '',
    enableScroll = false,
    threshold = 0.2
  }, forwardedRef) => {
    // 내부 ref 생성
    const innerRef = useRef<HTMLDivElement>(null);
    
    // 실제 사용할 ref 결정
    const ref = (forwardedRef || innerRef) as React.RefObject<HTMLDivElement>;
    
    // 적절한 애니메이션 훅 선택
    const animationOptions = { delay, duration };
    
    if (enableScroll) {
      // 스크롤 애니메이션을 사용할 경우
      const scrollRef = useScrollAnimation(animationType, animationOptions, threshold);
      
      return (
        <div 
          ref={(node) => {
            // forwardRef와 내부 ref 모두 설정
            if (typeof forwardedRef === 'function') {
              forwardedRef(node);
            } else if (forwardedRef) {
              forwardedRef.current = node;
            }
            // @ts-ignore - useScrollAnimation이 HTMLElement를 반환하므로
            scrollRef.current = node;
          }}
          className={className}
        >
          {children}
        </div>
      );
    } else {
      // 일반 입장 애니메이션을 사용할 경우
      const { id } = useEntranceAnimation(animationType, animationOptions);
      
      return (
        <div 
          id={id}
          ref={ref as React.RefObject<HTMLDivElement>}
          className={className}
        >
          {children}
        </div>
      );
    }
  }
);

MotionContainer.displayName = "MotionContainer";

// 간편하게 사용할 수 있는 훅 기반 애니메이션 컴포넌트들
export function FadeIn({ children, delay = 0, className = '' }: { children: ReactNode, delay?: number, className?: string }) {
  return (
    <MotionContainer animationType="fadeIn" delay={delay} className={className}>
      {children}
    </MotionContainer>
  );
}

export function SlideUp({ children, delay = 0, className = '' }: { children: ReactNode, delay?: number, className?: string }) {
  return (
    <MotionContainer animationType="slideUp" delay={delay} className={className}>
      {children}
    </MotionContainer>
  );
}

export function ScaleIn({ children, delay = 0, className = '' }: { children: ReactNode, delay?: number, className?: string }) {
  return (
    <MotionContainer animationType="scale" delay={delay} className={className}>
      {children}
    </MotionContainer>
  );
}

// 스크롤에 반응하는 애니메이션 컴포넌트들
export function ScrollFadeIn({ children, threshold = 0.2, className = '' }: { children: ReactNode, threshold?: number, className?: string }) {
  return (
    <MotionContainer animationType="fadeIn" enableScroll={true} threshold={threshold} className={className}>
      {children}
    </MotionContainer>
  );
}

export function ScrollSlideUp({ children, threshold = 0.2, className = '' }: { children: ReactNode, threshold?: number, className?: string }) {
  return (
    <MotionContainer animationType="slideUp" enableScroll={true} threshold={threshold} className={className}>
      {children}
    </MotionContainer>
  );
}