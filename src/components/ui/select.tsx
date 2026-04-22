import * as React from "react"
import { cn } from "../../lib/utils"

const Select = ({ children, value, onValueChange }: { children: React.ReactNode, value?: string, onValueChange?: (v: string) => void }) => {
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === SelectTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange });
        }
        return null;
      })}
    </div>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-full border border-slate-200 bg-transparent px-4 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <span className="material-symbols-rounded text-slate-500 text-[18px]">expand_more</span>
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder, value }: { placeholder?: string, value?: string }) => {
  return <span>{value || placeholder}</span>
}

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 mt-1 w-full">
      <div className="p-1">{children}</div>
    </div>
  )
}

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-xl py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-primary">
       <span className="material-symbols-rounded text-[14px]">check</span>
    </span>
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

// Simplified Select for now to fix build errors without adding Radix Select
// Use native select for better reliability in this context
export function NativeSelect({ className, value, onValueChange, children, placeholder }: any) {
  return (
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          "flex h-10 w-full appearance-none items-center justify-between rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
        <span className="material-symbols-rounded text-[18px]">expand_more</span>
      </div>
    </div>
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}
