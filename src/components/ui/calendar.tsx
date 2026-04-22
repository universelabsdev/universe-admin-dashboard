import * as React from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval, setYear, setMonth, getYear } from "date-fns";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

type CalendarView = "days" | "months" | "years";

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());
  const [view, setView] = React.useState<CalendarView>("days");

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i); // 50 years past, 50 years future

  const selectMonth = (monthIdx: number) => {
    setCurrentMonth(setMonth(currentMonth, monthIdx));
    setView("days");
  };

  const selectYear = (year: number) => {
    setCurrentMonth(setYear(currentMonth, year));
    setView("months"); // Go to month selection after picking year
  };

  return (
    <div className={cn("p-4 w-[320px] bg-card text-card-foreground rounded-[28px] select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div 
          className="flex items-center gap-1 cursor-pointer hover:bg-muted px-3 py-1.5 rounded-full transition-colors group"
          onClick={() => setView(view === "days" ? "years" : "days")}
        >
          <h4 className="text-sm font-black text-foreground">
            {view === "days" ? format(currentMonth, "MMMM yyyy") : 
             view === "months" ? format(currentMonth, "yyyy") : "Select Year"}
          </h4>
          <span className={cn(
            "material-symbols-rounded text-[18px] text-muted-foreground group-hover:text-primary transition-transform duration-300",
            view !== "days" && "rotate-180"
          )}>
            expand_more
          </span>
        </div>

        {view === "days" && (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full hover:bg-muted" 
              onClick={handlePrevMonth}
            >
              <span className="material-symbols-rounded text-[20px]">chevron_left</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full hover:bg-muted" 
              onClick={handleNextMonth}
            >
              <span className="material-symbols-rounded text-[20px]">chevron_right</span>
            </Button>
          </div>
        )}
      </div>

      {/* Days View */}
      {view === "days" && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div key={i} className="text-center text-[11px] font-black text-muted-foreground py-2 uppercase tracking-tighter">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const isSelected = selected && isSameDay(day, selected);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={i}
                  onClick={() => onSelect?.(day)}
                  className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-full text-sm font-bold transition-all relative",
                    !isCurrentMonth && "text-muted/40",
                    isCurrentMonth && !isSelected && "hover:bg-primary/10 text-card-foreground",
                    isSelected && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110 z-10",
                    isToday && !isSelected && "text-primary border-2 border-primary/20 bg-primary/5"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Months View */}
      {view === "months" && (
        <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {months.map((month, i) => (
            <button
              key={month}
              onClick={() => selectMonth(i)}
              className={cn(
                "h-14 rounded-2xl text-sm font-bold transition-all",
                currentMonth.getMonth() === i 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "hover:bg-muted text-card-foreground"
              )}
            >
              {month}
            </button>
          ))}
        </div>
      )}

      {/* Years View */}
      {view === "years" && (
        <ScrollArea className="h-[280px] pr-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="grid grid-cols-3 gap-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => selectYear(year)}
                className={cn(
                  "h-12 rounded-2xl text-sm font-bold transition-all",
                  getYear(currentMonth) === year 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "hover:bg-muted text-card-foreground"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
