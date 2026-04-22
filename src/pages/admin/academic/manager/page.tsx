import React from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";

export default function AcademicManagerPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Academic Manager</h2>
          <p className="text-slate-500 mt-1">Manage terms, courses, and class sections.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white rounded-full shadow-sm border-slate-200 hover:bg-slate-50">
            <span className="material-symbols-rounded mr-2 text-[18px] text-slate-500">calendar_month</span> Terms
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-md shadow-primary/20">
            <span className="material-symbols-rounded mr-2 text-[18px]">add</span> New Course
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Term Card */}
        <Card className="md:col-span-1 premium-card border-none bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden relative rounded-3xl">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/10 blur-xl"></div>
          
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></div>
              Current Term
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-white mb-3 tracking-tight">Fall 2026</div>
            <div className="flex items-center text-sm text-primary-foreground/90 mb-6 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
              <span className="material-symbols-rounded mr-2 text-[16px]">calendar_month</span> Sep 1 - Dec 15
            </div>
            
            <div className="space-y-4 bg-black/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-primary-foreground/80 text-sm">
                  <span className="material-symbols-rounded text-[16px] mr-2 opacity-70">group</span> Enrolled
                </div>
                <span className="font-bold text-white">8,432</span>
              </div>
              <div className="h-px w-full bg-white/10"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-primary-foreground/80 text-sm">
                  <span className="material-symbols-rounded text-[16px] mr-2 opacity-70">menu_book</span> Courses
                </div>
                <span className="font-bold text-white">450</span>
              </div>
            </div>
            
            <Button variant="secondary" className="w-full mt-6 bg-white text-primary hover:bg-slate-50 rounded-full shadow-lg border-0 font-semibold">
              Manage Term Settings
            </Button>
          </CardContent>
        </Card>

        {/* Course List */}
        <Card className="md:col-span-2 premium-card border-none rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100/50">
            <CardTitle className="text-lg font-semibold flex items-center">
              <span className="material-symbols-rounded mr-2 text-[20px] text-primary">school</span> Popular Courses
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90 hover:bg-primary/10 font-medium rounded-full">
              View All <span className="material-symbols-rounded ml-1 text-[16px]">arrow_forward</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100/50">
              {[
                { code: "CS101", name: "Introduction to Computer Science", students: 340, sections: 4, status: "Active", instructor: "Dr. Alan Turing" },
                { code: "MATH201", name: "Calculus II", students: 280, sections: 3, status: "Active", instructor: "Prof. Euler" },
                { code: "ENG105", name: "Academic Writing", students: 450, sections: 8, status: "Active", instructor: "Dr. Virginia Woolf" },
                { code: "PHYS101", name: "General Physics", students: 210, sections: 2, status: "Draft", instructor: "TBD" },
              ].map((course) => (
                <div key={course.code} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-sm border border-primary/20 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-rounded text-[20px]">menu_book</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{course.code}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-700">{course.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                        <span className="flex items-center bg-slate-100 px-2 py-1 rounded-md"><span className="material-symbols-rounded mr-1.5 text-[14px] text-slate-400">group</span> {course.students} students</span>
                        <span className="flex items-center bg-slate-100 px-2 py-1 rounded-md"><span className="material-symbols-rounded mr-1.5 text-[14px] text-slate-400">description</span> {course.sections} sections</span>
                        <span className="text-slate-400">Instructor: {course.instructor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <Badge 
                      variant="secondary" 
                      className={`font-medium px-3 py-1 rounded-full ${
                        course.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {course.status === 'Active' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
                      {course.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600">
                      <span className="material-symbols-rounded text-[20px]">more_vert</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
