import { MainNav } from '@/components/navigation/MainNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Video, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/auth-utils';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreateSessionDialog } from '@/components/training/CreateSessionDialog';
import { AssignSessionDialog } from '@/components/training/AssignSessionDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface Session {
    id: string;
    session_name: string;
    session_type: string;
    start_datetime: string;
    end_datetime: string;
    meeting_platform: string;
    meeting_link: string;
    status: string;
    attendees: string[];
}

export default function TrainingSessions() {
    const { user, profile } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!user || !profile) return;
        setLoading(true);

        const query = supabase.from('training_sessions').select('*');
        const { data, error } = await query.order('start_datetime', { ascending: true });

        if (error) {
            console.error("Error fetching sessions:", error);
            setSessions([]);
        } else {
            setSessions(data as Session[]);
        }
        setLoading(false);
    }, [user, profile]);

    useEffect(() => {
        fetchSessions();
    }, [user, profile, fetchSessions]);

    const handleSessionCreated = (sessionId: string) => {
        fetchSessions();
        setSelectedSessionId(sessionId);
        setAssignDialogOpen(true);
    };

    const handleAssignClick = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        setAssignDialogOpen(true);
    };

    const openDeleteDialog = (session: Session) => {
        setSessionToDelete(session);
        setDeleteDialogOpen(true);
    };

    const handleDeleteSession = async () => {
        if (!sessionToDelete) return;
        const { error } = await supabase.from('training_sessions').delete().eq('id', sessionToDelete.id);

        if (error) {
            toast.error(`Failed to delete session: ${error.message}`);
        } else {
            toast.success(`Session "${sessionToDelete.session_name}" deleted.`);
            fetchSessions();
        }
        setDeleteDialogOpen(false);
        setSessionToDelete(null);
    };

    const isAdmin = ['Team Lead', 'HR', 'Management'].includes(profile?.role?.role_name || '');

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Training Sessions</h1>
            <p className="text-muted-foreground">
              Join live training sessions and workshops to enhance your learning.
            </p>
          </div>
          {isAdmin && (
            <CreateSessionDialog onSessionCreated={handleSessionCreated} />
          )}
        </div>

        {loading ? <p>Loading sessions...</p> : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map(session => {
                const tenMinutes = 10 * 60 * 1000;
                const startTime = new Date(session.start_datetime).getTime();
                const now = new Date().getTime();
                const isJoinable = (startTime - now) < tenMinutes;

                return (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow flex flex-col">
                        <CardHeader>
                        <div className="flex items-start justify-between">
                            <Video className="h-8 w-8 text-primary" />
                            <Badge variant="default">{session.status}</Badge>
                        </div>
                        <CardTitle className="text-lg pt-2">{session.session_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between">
                        <div className="space-y-2 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(session.start_datetime).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {new Date(session.start_datetime).toLocaleTimeString()} - {new Date(session.end_datetime).toLocaleTimeString()}
                            </div>
                            <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {session.attendees?.length || 0} registered
                            </div>
                        </div>
                        {profile?.role?.role_name === 'Trainee' ? (
                            isJoinable ? (
                                <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button className="w-full">Join Session</Button>
                                </a>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="w-full">
                                                <Button className="w-full" disabled>Join Session</Button>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>You can join 10 minutes before the session starts.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        ) : (
                            <div className="flex items-center gap-2 w-full">
                                <Button className="w-full" variant="outline" onClick={() => handleAssignClick(session.id)}>Assign</Button>
                                <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(session)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        </CardContent>
                    </Card>
                );
            })}
            </div>
        )}
      </main>

      <AssignSessionDialog 
        sessionId={selectedSessionId}
        open={isAssignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onSessionAssigned={fetchSessions}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the session
              <strong> {sessionToDelete?.session_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession}>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}