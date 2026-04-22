import React from "react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PlaceholderPage({ title, description }: { title: string, description: string }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-primary/20">
        <span className="material-symbols-rounded text-5xl text-primary">construction</span>
      </div>
      <h1 className="text-3xl font-heading font-bold tracking-tight text-slate-900 mb-2">{title}</h1>
      <p className="text-lg text-slate-500 max-w-md mb-8">
        {description}
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded mr-2 text-lg">arrow_back</span> Go Back
        </Button>
        <Button onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
