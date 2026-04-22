import React, { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../../../../components/ui/alert";
import { Switch } from "../../../../components/ui/switch";
import { Label } from "../../../../components/ui/label";

export default function KillSwitchPage() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isRegistrationLocked, setIsRegistrationLocked] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center font-heading">
            <span className="material-symbols-rounded mr-3 text-[32px] text-red-500">gpp_maybe</span> System Kill Switch
          </h2>
          <p className="text-slate-500 mt-1">Emergency controls for the entire UniVerse platform.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
          <span className="material-symbols-rounded text-[16px] text-emerald-500 animate-pulse">monitoring</span>
          <span className="text-sm font-semibold text-slate-700">System Status: Operational</span>
        </div>
      </div>

      <Alert variant="destructive" className="bg-red-50/80 border-red-200 text-red-900 shadow-sm shadow-red-100/50 rounded-2xl">
        <span className="material-symbols-rounded text-[20px] text-red-600 absolute left-4 top-4">warning</span>
        <AlertTitle className="font-bold text-lg ml-7">Extreme Caution Advised</AlertTitle>
        <AlertDescription className="ml-7 mt-1 text-red-800/90 text-sm leading-relaxed">
          Actions on this page immediately affect all active users, APIs, and connected services. 
          Use only during critical security incidents or scheduled major downtime. All actions are logged and require secondary authentication.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Global Maintenance Mode */}
        <Card className={`premium-card border-none overflow-hidden relative transition-all duration-300 rounded-3xl ${isMaintenanceMode ? 'ring-2 ring-amber-500 shadow-[0_8px_30px_-4px_rgba(245,158,11,0.2)]' : 'hover:shadow-md'}`}>
          <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-300 ${isMaintenanceMode ? 'bg-amber-500' : 'bg-slate-200'}`}></div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl text-slate-900 font-heading">
              <div className={`p-2 rounded-full mr-3 transition-colors duration-300 ${isMaintenanceMode ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                <span className="material-symbols-rounded text-[20px]">dns</span>
              </div>
              Global Maintenance Mode
            </CardTitle>
            <CardDescription className="text-slate-500 mt-2">
              Takes the entire application offline for all non-admin users. Shows a "We'll be right back" page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`flex items-center justify-between p-5 rounded-2xl border transition-colors duration-300 ${isMaintenanceMode ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="space-y-1">
                <Label htmlFor="maintenance-mode" className="text-base font-semibold text-slate-900">Enable Maintenance Mode</Label>
                <p className="text-sm font-medium text-slate-500 flex items-center">
                  Status: <span className={`ml-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isMaintenanceMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{isMaintenanceMode ? 'Active' : 'Inactive'}</span>
                </p>
              </div>
              <Switch 
                id="maintenance-mode" 
                checked={isMaintenanceMode}
                onCheckedChange={setIsMaintenanceMode}
                className="data-[state=checked]:bg-amber-500 scale-110"
              />
            </div>
            {isMaintenanceMode && (
              <div className="p-4 bg-amber-50/80 text-amber-800 text-sm rounded-2xl border border-amber-200/50 flex items-start animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-rounded text-[20px] mr-3 text-amber-600 shrink-0 mt-0.5">error</span>
                <p className="leading-relaxed">
                  <strong className="font-semibold block mb-1">Warning:</strong> 
                  12,450 active sessions will be terminated immediately. API endpoints will return 503 Service Unavailable.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lock New Registrations */}
        <Card className={`premium-card border-none overflow-hidden relative transition-all duration-300 rounded-3xl ${isRegistrationLocked ? 'ring-2 ring-indigo-500 shadow-[0_8px_30px_-4px_rgba(99,102,241,0.2)]' : 'hover:shadow-md'}`}>
          <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-300 ${isRegistrationLocked ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl text-slate-900 font-heading">
              <div className={`p-2 rounded-full mr-3 transition-colors duration-300 ${isRegistrationLocked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                <span className="material-symbols-rounded text-[20px]">{isRegistrationLocked ? 'lock' : 'lock_open'}</span>
              </div>
              Registration Lock
            </CardTitle>
            <CardDescription className="text-slate-500 mt-2">
              Prevents any new users from signing up or verifying their university emails. Existing users can still log in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`flex items-center justify-between p-5 rounded-2xl border transition-colors duration-300 ${isRegistrationLocked ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="space-y-1">
                <Label htmlFor="registration-lock" className="text-base font-semibold text-slate-900">Lock Registrations</Label>
                <p className="text-sm font-medium text-slate-500 flex items-center">
                  Status: <span className={`ml-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isRegistrationLocked ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{isRegistrationLocked ? 'Locked' : 'Open'}</span>
                </p>
              </div>
              <Switch 
                id="registration-lock" 
                checked={isRegistrationLocked}
                onCheckedChange={setIsRegistrationLocked}
                className="data-[state=checked]:bg-indigo-500 scale-110"
              />
            </div>
            {isRegistrationLocked && (
              <div className="p-4 bg-indigo-50/80 text-indigo-800 text-sm rounded-2xl border border-indigo-200/50 flex items-start animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-rounded text-[20px] mr-3 text-indigo-600 shrink-0 mt-0.5">shield</span>
                <p className="leading-relaxed">
                  <strong className="font-semibold block mb-1">Active Lock:</strong> 
                  Sign-up routes are currently disabled. Pending email verifications will be paused until the lock is lifted.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* The Big Red Button */}
        <Card className="md:col-span-2 premium-card border-none overflow-hidden relative bg-gradient-to-br from-red-50/50 to-white ring-1 ring-red-200/50 shadow-[0_8px_30px_-4px_rgba(239,68,68,0.1)] rounded-3xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-red-700 text-2xl font-bold flex items-center justify-center font-heading">
              <span className="material-symbols-rounded mr-2 text-[24px]">gpp_maybe</span> Emergency Data Freeze
            </CardTitle>
            <CardDescription className="text-red-600/80 text-base max-w-2xl mx-auto mt-2">
              Instantly revokes all write access to the database. The app becomes read-only.
              Use this if you suspect a database breach, massive data corruption event, or active attack.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <Button 
                variant="destructive" 
                size="lg" 
                className="relative h-28 w-full sm:w-[400px] text-2xl font-bold uppercase tracking-widest shadow-2xl hover:bg-red-700 transition-all active:scale-95 rounded-3xl border border-red-500/50"
                onClick={() => {
                  // In a real app, this would trigger a modal requiring password/MFA confirmation
                  if(window.confirm("CRITICAL WARNING: Are you absolutely sure you want to freeze the database? This will break all core functionality.")) {
                    alert("Database frozen. All write operations blocked.");
                  }
                }}
              >
                <span className="material-symbols-rounded mr-4 text-[40px]">power_settings_new</span> Initiate Data Freeze
              </Button>
            </div>
            <div className="mt-8 flex items-center text-sm text-slate-500 font-mono bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              <span className="material-symbols-rounded text-[16px] mr-2 text-slate-400">lock</span>
              Requires secondary authentication (MFA) to confirm.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
