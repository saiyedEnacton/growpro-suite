import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TrainerProfile {
    id: string;
    first_name: string;
    last_name: string;
}

interface CreateSessionDialogProps {
  onSessionCreated: (sessionId: string) => void;
}

export function CreateSessionDialog({ onSessionCreated }: CreateSessionDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [platform, setPlatform] = useState("");
  const [link, setLink] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
        const fetchTrainers = async () => {
            const { data: rolesData, error: rolesError } = await supabase
                .from('roles')
                .select('id')
                .in('role_name', ['Management', 'HR', 'Team Lead']);
            
            if (rolesError || !rolesData) {
                return toast.error("Could not fetch trainer roles.");
            }

            const roleIds = rolesData.map(r => r.id);

            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .in('role_id', roleIds);

            if (error) {
                toast.error("Could not fetch trainers list.");
            } else {
                setTrainers(data as TrainerProfile[]);
            }
        }
        fetchTrainers();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return toast.error("You must be logged in.");
    if (!sessionName || !trainerId || !startDateTime || !endDateTime || !link) {
        return toast.warning("Please fill out all required fields.");
    }
    setCreating(true);

    // Convert local datetime string to full ISO string (UTC)
    const utcStart = new Date(startDateTime).toISOString();
    const utcEnd = new Date(endDateTime).toISOString();

    const { data, error } = await supabase
      .from('training_sessions')
      .insert({
        session_name: sessionName,
        session_type: sessionType,
        trainer_id: trainerId,
        start_datetime: utcStart,
        end_datetime: utcEnd,
        meeting_platform: platform,
        meeting_link: link,
        created_by: user.id,
        attendees: [],
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error creating session:", error);
      toast.error(`Failed to create session: ${error.message}`);
    } else {
      toast.success("Session created! Now assign trainees.");
      onSessionCreated(data.id);
      setOpen(false);
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Session</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Training Session</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule a new session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Session Name</Label>
                <Input id="name" value={sessionName} onChange={e => setSessionName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Session Type</Label>
                <Input id="type" placeholder="e.g., Workshop, Webinar" value={sessionType} onChange={e => setSessionType(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trainer" className="text-right">Trainer</Label>
                <select id="trainer" value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className="col-span-3">
                    <option value="">Select a Trainer</option>
                    {trainers.map(t => (
                        <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                    ))}
                </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start" className="text-right">Start Time</Label>
                <Input id="start" type="datetime-local" value={startDateTime} onChange={e => setStartDateTime(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end" className="text-right">End Time</Label>
                <Input id="end" type="datetime-local" value={endDateTime} onChange={e => setEndDateTime(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="platform" className="text-right">Platform</Label>
                <Input id="platform" placeholder="e.g., Zoom, Google Meet" value={platform} onChange={e => setPlatform(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="link" className="text-right">Meeting Link</Label>
                <Input id="link" type="url" value={link} onChange={e => setLink(e.target.value)} className="col-span-3" />
            </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={creating}>
            {creating ? "Creating..." : "Create & Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
