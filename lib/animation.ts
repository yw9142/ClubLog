"use client";

// motion 라이브러리 최신 문법으로 import 변경
import { animate, inView, scroll, stagger, timeline } from "motion/react";

// 요소 페이드인 애니메이션
export function fadeIn(element: HTMLElement, delay = 0) {
  animate(element, 
    { opacity: [0, 1], y: [20, 0] },
    { duration: 0.5, delay, easing: 'ease-out' }
  );
}

// 요소 페이드아웃 애니메이션
export function fadeOut(element: HTMLElement, delay = 0) {
  animate(element, 
    { opacity: [1, 0], y: [0, -20] },
    { duration: 0.3, delay, easing: 'ease-in' }
  );
}

// 스케일 애니메이션
export function scaleIn(element: HTMLElement, delay = 0) {
  animate(element, 
    { opacity: [0, 1], scale: [0.8, 1] },
    { duration: 0.5, delay, easing: 'ease-out' }
  );
}

// 호버 효과 설정
export function setupHoverAnimation(element: HTMLElement, scale = 1.05) {
  element.addEventListener('mouseenter', () => {
    animate(element, { scale }, { duration: 0.2 });
  });
  
  element.addEventListener('mouseleave', () => {
    animate(element, { scale: 1 }, { duration: 0.2 });
  });
}

// 스크롤 애니메이션 설정
export function setupScrollAnimation(element: HTMLElement) {
  inView(element, () => {
    animate(element, 
      { opacity: [0, 1], y: [50, 0] },
      { delay: 0.2, duration: 0.6, easing: [0.17, 0.55, 0.55, 1] }
    );
  }, { margin: "-20% 0px -20% 0px" });
}

// 스태거 애니메이션 (여러 요소에 차례대로 애니메이션 적용)
export function staggerItems(elements: HTMLElement[]) {
  animate(
    elements,
    { opacity: [0, 1], y: [20, 0] },
    { delay: stagger(0.1), duration: 0.5, easing: 'ease-out' }
  );
}

// 애니메이션 타임라인 생성
export function createAnimationTimeline(config: any[]) {
  const sequence = [];
  
  for (const item of config) {
    sequence.push([
      item.element,
      item.animation,
      { duration: item.duration || 0.5, delay: item.delay || 0 }
    ]);
  }
  
  return timeline(sequence);
}

// 스크롤 연동 애니메이션
export function setupScrollBasedAnimation(element: HTMLElement, property: string, range: number[]) {
  scroll(
    ({ y }) => {
      const normalized = Math.min(Math.max((y.current - y.start) / (y.end - y.start), 0), 1);
      const value = range[0] + normalized * (range[1] - range[0]);
      
      if (property === 'opacity') {
        element.style.opacity = String(value);
      } else if (property === 'y') {
        element.style.transform = `translateY(${value}px)`;
      } else if (property === 'scale') {
        element.style.transform = `scale(${value})`;
      }
    },
    { target: element }
  );
}

// 드래그 가능한 애니메이션 요소 설정
export function setupDraggable(element: HTMLElement) {
  element.setAttribute('draggable', 'true');
  
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;
  
  element.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    element.style.cursor = 'grabbing';
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    animate(element, { x: translateX, y: translateY }, { duration: 0, easing: 'linear' });
  });
  
  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = 'grab';
    }
  });
}

// 각 요소에 고유 ID 부여
let uniqueId = 0;
export function generateUniqueId(prefix = 'anim'): string {
  return `${prefix}-${uniqueId++}`;
}