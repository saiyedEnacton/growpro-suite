import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { QuestionManager } from './QuestionManager';

interface AssessmentTemplate {
  id: string;
  course_id: string;
  title: string;
  description: string;
  assessment_type: string;
  passing_score: number;
  time_limit_minutes: number;
  is_mandatory: boolean;
  instructions: string;
  created_by: string;
}

interface AssessmentDialogProps {
  courseId: string;
  assessment: AssessmentTemplate | null;
  onClose: () => void;
}

export function AssessmentDialog({ courseId, assessment, onClose }: AssessmentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(assessment?.id || null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    assessment_type: 'quiz',
    passing_score: 70,
    time_limit_minutes: 60,
    is_mandatory: true,
    instructions: ''
  });

  useEffect(() => {
    if (assessment) {
      setForm({
        title: assessment.title,
        description: assessment.description || '',
        assessment_type: assessment.assessment_type,
        passing_score: assessment.passing_score,
        time_limit_minutes: assessment.time_limit_minutes || 60,
        is_mandatory: assessment.is_mandatory,
        instructions: assessment.instructions || ''
      });
      setCurrentAssessmentId(assessment.id);
    }
  }, [assessment]);

  const handleSave = async () => {
    if (!user || !form.title.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // For Quiz type, enforce that questions must exist after saving
    if (form.assessment_type === 'quiz' && assessment && assessment.id) {
      const { count } = await supabase
        .from('assessment_questions')
        .select('*', { count: 'exact', head: true })
        .eq('assessment_template_id', assessment.id);
        
      if (!count || count === 0) {
        toast({
          title: "Warning",
          description: "Quiz assessments should have at least one question. Please add questions in the Questions tab.",
          variant: "default",
        });
      }
    }

    try {
      setSaving(true);
      
      const assessmentData = {
        ...form,
        course_id: courseId,
        created_by: user.id
      };

      let result;
      if (assessment) {
        // Update existing assessment
        const { data, error } = await supabase
          .from('assessment_templates')
          .update(assessmentData)
          .eq('id', assessment.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new assessment
        const { data, error } = await supabase
          .from('assessment_templates')
          .insert(assessmentData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        setCurrentAssessmentId(result.id);
      }

      toast({
        title: "Success",
        description: `Assessment ${assessment ? 'updated' : 'created'} successfully.`,
      });

      // If it's a new assessment, keep the dialog open so they can add questions
      if (!assessment) {
        // Reset form for new assessment, but keep current assessment ID for questions
        // Don't close the dialog yet
      }

    } catch (error: any) {
      console.error('Error saving assessment:', error);
      toast({
        title: "Error",
        description: `Failed to ${assessment ? 'update' : 'create'} assessment. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Assessment Details</TabsTrigger>
          <TabsTrigger value="questions" disabled={!currentAssessmentId}>
            Questions {currentAssessmentId ? '' : '(Save first)'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Assessment Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Module 1 Quiz"
              />
            </div>
            <div>
              <Label htmlFor="assessment_type">Assessment Type</Label>
              <Select
                value={form.assessment_type}
                onValueChange={(value) => setForm({ ...form, assessment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the assessment"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passing_score">Passing Score (%)</Label>
              <Input
                id="passing_score"
                type="number"
                min="0"
                max="100"
                value={form.passing_score}
                onChange={(e) => setForm({ ...form, passing_score: parseInt(e.target.value) || 70 })}
              />
            </div>
            <div>
              <Label htmlFor="time_limit">Time Limit (minutes)</Label>
              <Input
                id="time_limit"
                type="number"
                min="1"
                value={form.time_limit_minutes}
                onChange={(e) => setForm({ ...form, time_limit_minutes: parseInt(e.target.value) || 60 })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Instructions for students taking this assessment"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_mandatory"
              checked={form.is_mandatory}
              onCheckedChange={(checked) => setForm({ ...form, is_mandatory: checked })}
            />
            <Label htmlFor="is_mandatory">Mandatory Assessment</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : assessment ? 'Update Assessment' : 'Create Assessment'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {currentAssessmentId && (
            <QuestionManager assessmentId={currentAssessmentId} />
          )}
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
