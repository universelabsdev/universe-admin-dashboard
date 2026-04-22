import * as React from "react";
import { format, setHours, setMinutes, parseISO, isValid } from "date-fns";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export interface DateTimePickerProps {
  date?: string; // ISO string
  onChange?: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({ date, onChange, label, placeholder, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState<Date | undefined>(
    date ? (isValid(parseISO(date)) ? parseISO(date) : new Date()) : undefined
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleDateSelect = (d: Date) => {
    const newDate = tempDate ? new Date(tempDate) : new Date();
    newDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    setTempDate(newDate);
  };

  const handleHourSelect = (h: number) => {
    const newDate = tempDate ? new Date(tempDate) : new Date();
    newDate.setHours(h);
    setTempDate(newDate);
  };

  const handleMinuteSelect = (m: number) => {
    const newDate = tempDate ? new Date(tempDate) : new Date();
    newDate.setMinutes(m);
    setTempDate(newDate);
  };

  const handleApply = () => {
    if (tempDate) {
      onChange?.(tempDate.toISOString());
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className={cn("grid gap-2", className)}>
        {label && <label className="text-sm font-bold text-muted-foreground ml-1">{label}</label>}
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-medium rounded-2xl h-12 border-input bg-background hover:bg-muted transition-all",
              !date && "text-muted-foreground"
            )}
          >
            <span className="material-symbols-rounded mr-2 text-primary">calendar_month</span>
            {date && isValid(parseISO(date)) ? format(parseISO(date), "PPP p") : placeholder || "Pick a date"}
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[360px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl bg-card text-card-foreground">
        <DialogHeader className="p-6 bg-slate-950 dark:bg-slate-900 text-white shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {tempDate ? format(tempDate, "PPP") : "Select Date & Time"}
          </DialogTitle>
          <div className="text-slate-400 text-sm font-medium">
            {tempDate ? format(tempDate, "p") : "--:--"}
          </div>
        </DialogHeader>

        <Tabs defaultValue="date" className="w-full">
          <TabsList className="w-full h-14 bg-muted/50 rounded-none p-0 flex">
            <TabsTrigger 
              value="date" 
              className="flex-1 h-full data-[state=active]:bg-card data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all font-bold text-muted-foreground"
            >
              <span className="material-symbols-rounded mr-2">calendar_today</span> Date
            </TabsTrigger>
            <TabsTrigger 
              value="time" 
              className="flex-1 h-full data-[state=active]:bg-card data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all font-bold text-muted-foreground"
            >
              <span className="material-symbols-rounded mr-2">schedule</span> Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="date" className="mt-0 flex justify-center p-2 bg-card">
            <Calendar selected={tempDate} onSelect={handleDateSelect} />
          </TabsContent>

          <TabsContent value="time" className="mt-0 bg-card">
            <div className="flex h-[320px] p-4 gap-4 overflow-hidden">
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Hours</span>
                <ScrollArea className="h-full w-full pr-2">
                  <div className="flex flex-col gap-1">
                    {hours.map(h => (
                      <button
                        key={h}
                        onClick={() => handleHourSelect(h)}
                        className={cn(
                          "h-10 w-full rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                          tempDate?.getHours() === h 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                            : "hover:bg-muted text-card-foreground"
                        )}
                      >
                        {h.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Minutes</span>
                <ScrollArea className="h-full w-full pr-2">
                  <div className="flex flex-col gap-1">
                    {minutes.map(m => (
                      <button
                        key={m}
                        onClick={() => handleMinuteSelect(m)}
                        className={cn(
                          "h-10 w-full rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                          tempDate?.getMinutes() === m 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                            : "hover:bg-muted text-card-foreground"
                        )}
                      >
                        {m.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-6 bg-muted/30 flex justify-end gap-3 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)}
            className="rounded-full px-6 font-bold text-muted-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
