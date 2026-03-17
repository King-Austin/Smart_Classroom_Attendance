import { Bell, LogOut } from "lucide-react";
import { Profile } from "@/types";

interface DashboardHeaderProps {
  profile: Profile | null;
  onLogout: () => void;
}

export const DashboardHeader = ({ profile, onLogout }: DashboardHeaderProps) => {
  return (
    <div className="px-5 pt-5 pb-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold font-heading text-foreground">
          Hi, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
        </h1>
        <p className="text-xs text-muted-foreground">
          {profile?.department} · {profile?.level} Level
        </p>
      </div>
      <div className="flex gap-2">
        <button className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <Bell className="w-4 h-4 text-foreground" />
        </button>
        <button onClick={onLogout} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <LogOut className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
};
