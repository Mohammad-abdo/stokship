import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function ModeratorSettings() {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Moderator Settings</h1>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-sm border text-center text-gray-500">
        <p>Profile and dashboard settings will be managed here.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/stockship/moderator/dashboard')}>
            Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
