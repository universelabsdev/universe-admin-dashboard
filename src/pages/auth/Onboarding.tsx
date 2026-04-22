import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApiClient } from "@/lib/api-client";

import { useQueryClient } from "@tanstack/react-query";

export default function OnboardingPage() {
  const { user } = useClerkUser();
  const navigate = useNavigate();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    bio: "",
    role: "STUDENT",
    branchId: "",
    departmentId: "",
    graduationYear: "",
    studentId: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user: backendUser, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && backendUser) {
      // If the backend user exists and is fully registered, redirect to home
      navigate("/");
    }
  }, [backendUser, userLoading, navigate]);

  useEffect(() => {
    const fetchDirectoryData = async () => {
      try {
        const [branchesRes, deptsRes, rolesRes] = await Promise.all([
          api.get('/directory/branches'),
          api.get('/directory/departments'),
          api.get('/directory/roles')
        ]);
        setBranches(Array.isArray(branchesRes) ? branchesRes : (branchesRes as any).data || []);
        setDepartments(Array.isArray(deptsRes) ? deptsRes : (deptsRes as any).data || []);
        setRoles(Array.isArray(rolesRes) ? rolesRes : (rolesRes as any).data || []);
      } catch (err) {
        console.error("Failed to fetch directory data", err);
      }
    };
    fetchDirectoryData();
  }, [api]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append('avatar', file);

    try {
      await api.post('/users/me/avatar', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success("Avatar uploaded successfully!");
      // Optionally refresh user data to show new avatar
    } catch (err) {
      toast.error("Failed to upload avatar");
    }
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Prepare data for backend matching auth.controller.ts register schema
      const submissionData = {
        role: formData.role.toUpperCase(), // Backend expects uppercase Role enum
        studentId: formData.role === "STUDENT" ? formData.studentId || `STU-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        branchId: formData.branchId,
        departmentId: formData.departmentId,
        username: formData.username,
        bio: formData.bio,
        academicYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
      };

      await api.post('/auth/register', submissionData);
      toast.success("Profile completed successfully!");
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="material-symbols-rounded text-primary-foreground">rocket_launch</span>
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">Welcome to UniVerse</h1>
          <p className="text-muted-foreground mt-2">Let's get your profile set up so you can start connecting.</p>
        </div>

        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Step {step} of 2</CardTitle>
              <span className="text-sm text-muted-foreground">{step === 1 ? "Basic Info" : "Academic Details"}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500" 
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-sm">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-rounded text-4xl text-muted-foreground">person</span>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                    <Button 
                      size="icon" 
                      className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="material-symbols-rounded text-[16px]">add_a_photo</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="e.g. Jane" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="e.g. Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={formData.username} onChange={handleChange} placeholder="e.g. janedoe" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Short Bio</Label>
                  <Input id="bio" value={formData.bio} onChange={handleChange} placeholder="A quick sentence about yourself" />
                </div>

                <Button className="w-full mt-4" onClick={handleNext}>Continue</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="role">Primary Role</Label>
                  <select id="role" value={formData.role} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    {roles.length > 0 ? (
                      roles.map(r => (
                        <option key={r.id} value={r.name}>{r.name.charAt(0) + r.name.slice(1).toLowerCase().replace(/_/g, ' ')}</option>
                      ))
                    ) : (
                      <>
                        <option value="STUDENT">Student</option>
                        <option value="FACULTY">Faculty</option>
                        <option value="ALUMNI">Alumni</option>
                        <option value="STAFF">Staff</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchId">University Branch</Label>
                  <select id="branchId" value={formData.branchId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select a branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departmentId">Major / Department</Label>
                  <select id="departmentId" value={formData.departmentId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select a department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year (Optional)</Label>
                  <Input id="graduationYear" type="number" value={formData.graduationYear} onChange={handleChange} placeholder="e.g. 2026" />
                </div>

                {formData.role === "STUDENT" && (
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input id="studentId" value={formData.studentId} onChange={handleChange} placeholder="e.g. STU-123456" />
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="w-1/3" onClick={handleBack}>Back</Button>
                  <Button className="w-2/3" onClick={handleComplete} disabled={loading}>
                    {loading ? "Saving..." : "Complete Profile"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
