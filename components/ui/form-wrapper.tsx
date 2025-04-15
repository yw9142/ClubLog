"use client"

import * as React from "react"
import { useForm, FormProvider, UseFormProps, FieldValues, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"

interface FormWrapperProps<T extends FieldValues> extends React.FormHTMLAttributes<HTMLFormElement> {
  schema: z.ZodType<T>
  defaultValues?: UseFormProps<T>['defaultValues']
  onSubmit: SubmitHandler<T>
  children: React.ReactNode
  className?: string
  resetOnSubmit?: boolean
}

export function FormWrapper<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  resetOnSubmit = false,
  ...props
}: FormWrapperProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur"
  })

  const handleSubmit = async (data: T) => {
    await onSubmit(data)
    if (resetOnSubmit) {
      methods.reset()
    }
  }

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={methods.handleSubmit(handleSubmit)} 
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  )
}

// 폼 항목 래퍼
interface FormFieldProps {
  name: string
  label?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  name,
  label,
  description,
  children,
  className
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label 
            htmlFor={name}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        </div>
      )}
      {children}
      {description && (
        <p className="text-[0.8rem] text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}

// 폼 에러 메시지
interface FormErrorProps {
  name: string
}

export function FormError({ name }: FormErrorProps) {
  const { formState: { errors } } = useForm()
  const error = errors[name]
  
  if (!error) return null

  return (
    <p className="text-sm font-medium text-destructive mt-1">
      {error.message as string}
    </p>
  )
}

// 폼 제출 버튼
interface FormSubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function FormSubmit({
  children,
  className,
  ...props
}: FormSubmitProps) {
  const { formState } = useForm()
  const { isSubmitting } = formState

  return (
    <button
      type="submit"
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      disabled={isSubmitting}
      {...props}
    >
      {isSubmitting ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
          처리 중...
        </>
      ) : (
        children
      )}
    </button>
  )
}