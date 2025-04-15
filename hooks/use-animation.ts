"use client";

import { useEffect, useRef } from 'react';
import { generateUniqueId } from '@/lib/animation';

// 최신 motion 라이브러리 import 문법으로 변경
import { animate, inView } from 'motion/react';

type AnimationOptions = {
  duration?: number;
  delay?: number;
  easing?: string | number[];
};

type AnimationType = 'fadeIn' | 'slideUp' | 'scale' | 'none';

/**
 * 요소에 입장 애니메이션을 적용하는 훅
 * @param type 애니메이션 타입
 * @param options 애니메이션 옵션
 * @returns ref와 id
 */
export function useEntranceAnimation(type: AnimationType = 'fadeIn', options: AnimationOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const id = useRef<string>(generateUniqueId('anim'));
  
  useEffect(() => {
    const element = ref.current;
    if (!element || type === 'none') return;
    
    const duration = options.duration || 0.5;
    const delay = options.delay || 0;
    const easing = options.easing || 'ease-out';
    
    if (type === 'fadeIn') {
      animate(element, 
        { opacity: [0, 1] },
        { duration, delay, easing }
      );
    } else if (type === 'slideUp') {
      animate(element, 
        { opacity: [0, 1], y: [20, 0] },
        { duration, delay, easing }
      );
    } else if (type === 'scale') {
      animate(element, 
        { opacity: [0, 1], scale: [0.9, 1] },
        { duration, delay, easing }
      );
    }
  }, [type, options]);
  
  return { ref, id: id.current };
}

/**
 * 스크롤 시 요소가 뷰포트에 들어올 때 애니메이션을 적용하는 훅
 * @param type 애니메이션 타입
 * @param options 애니메이션 옵션
 * @param threshold 요소가 얼마나 보여야 애니메이션을 시작할지 결정하는 값 (0-1)
 * @returns ref
 */
export function useScrollAnimation(
  type: AnimationType = 'fadeIn',
  options: AnimationOptions = {},
  threshold: number = 0.2
) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element || type === 'none') return;
    
    const duration = options.duration || 0.6;
    const delay = options.delay || 0.1;
    const easing = options.easing || [0.17, 0.55, 0.55, 1]; // 자연스러운 이징
    
    inView(element, () => {
      if (type === 'fadeIn') {
        animate(element, 
          { opacity: [0, 1] },
          { duration, delay, easing }
        );
      } else if (type === 'slideUp') {
        animate(element, 
          { opacity: [0, 1], y: [30, 0] },
          { duration, delay, easing }
        );
      } else if (type === 'scale') {
        animate(element, 
          { opacity: [0, 1], scale: [0.9, 1] },
          { duration, delay, easing }
        );
      }
    }, { amount: threshold });
    
  }, [type, options, threshold]);
  
  return ref;
}

/**
 * 요소에 호버 애니메이션을 적용하는 훅
 * @param hoverScale 호버 시 적용할 스케일 값
 * @returns ref
 */
export function useHoverAnimation(hoverScale: number = 1.05) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleMouseEnter = () => {
      animate(element, { scale: hoverScale }, { duration: 0.2 });
    };
    
    const handleMouseLeave = () => {
      animate(element, { scale: 1 }, { duration: 0.2 });
    };
    
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hoverScale]);
  
  return ref;
}