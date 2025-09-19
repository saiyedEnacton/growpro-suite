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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from 'sonner';

interface SubmitWorkDialogProps {
  assignmentId: string;
  onSubmited: () => void;
}

export function SubmitWorkDialog({ assignmentId, onSubmited }: SubmitWorkDialogProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [submissionLink, setSubmissionLink] = useState("");
  const [comments, setComments] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!submissionLink && !file) {
        toast.warning("Please provide a submission link or upload a file.");
        return;
    }

    setUploading(true);
    let file_url = null;

    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${assignmentId}-${Date.now()}.${fileExt}`;
        const filePath = `project-submissions/${fileName}`;

        const { error: uploadError } = await supabase.storage
        .from('project-submissions')
        .upload(filePath, file);

        if (uploadError) {
            console.error("Error uploading file:", uploadError);
            toast.error(`File upload failed: ${uploadError.message}`);
            setUploading(false);
            return;
        }
        file_url = filePath;
    }

    const { error: dbError } = await supabase
      .from('project_milestone_submissions')
      .insert([
        {
          assignment_id: assignmentId,
          submitted_by: user.id,
          submission_content: comments,
          file_url: submissionLink || file_url, // Use link if provided, otherwise the uploaded file path
        },
      ]);

    if (dbError) {
      console.error("Error saving submission:", dbError);
      toast.error(`Submission failed: ${dbError.message}`);
    } else {
      toast.success("Work submitted successfully!");
      // Also update the assignment status
      await supabase.from('project_assignments').update({ status: 'Submitted' }).eq('id', assignmentId);
      onSubmited();
    }

    setUploading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Submit Work</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Your Work</DialogTitle>
          <DialogDescription>
            Provide a link to your work (e.g., GitHub, live demo) or upload a file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Input 
                placeholder="https://github.com/your-repo" 
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
            />
            <div className="text-center text-xs text-muted-foreground">OR</div>
          <Input type="file" onChange={handleFileChange} />
          <Textarea
            placeholder="Add any comments about your submission..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
