"use client";

import { ReactNode, useEffect, useId } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { animate } from 'motion/react';

interface AnimatedCardProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedCard({ 
  header, 
  children, 
  footer, 
  delay = 0,
  className = "" 
}: AnimatedCardProps) {
  const uniqueId = useId();
  
  useEffect(() => {
    const element = document.getElementById(`animated-card-${uniqueId}`);
    if (element) {
      animate(element, 
        { opacity: [0, 1], y: [20, 0] }, 
        { delay: delay, duration: 0.3, easing: 'ease-out' }
      );
    }
  }, [delay, uniqueId]);
  
  return (
    <div
      id={`animated-card-${uniqueId}`}
      className={`h-full ${className}`}
      onMouseEnter={(e) => animate(e.currentTarget, { y: -5 }, { duration: 0.2 })}
      onMouseLeave={(e) => animate(e.currentTarget, { y: 0 }, { duration: 0.2 })}
    >
      <Card className="h-full">
        {header && <CardHeader>{header}</CardHeader>}
        <CardContent>{children}</CardContent>
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    </div>
  );
}