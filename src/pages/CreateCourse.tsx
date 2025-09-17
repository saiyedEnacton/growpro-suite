import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainNav } from '@/components/navigation/MainNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function CreateCourse() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    course_name: '',
    course_description: '',
    course_type: '',
    difficulty_level: 'Beginner',
    target_role: '',
    learning_objectives: '',
    is_mandatory: false,
    completion_rule: 'pass_all_assessments',
    minimum_passing_percentage: 70
  });

  const canCreateCourse = profile?.role?.role_name === 'Team Lead' || 
                         profile?.role?.role_name === 'HR' ||
                         profile?.role?.role_name === 'Management';

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateCourse) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create courses",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...formData,
          created_by: profile?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course created successfully"
      });
      
      navigate(`/courses/${data.id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateCourse) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/courses')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">You don't have permission to create courses</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/courses')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Course</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="course_name">Course Name</Label>
                <Input
                  id="course_name"
                  value={formData.course_name}
                  onChange={(e) => handleInputChange('course_name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course_description">Course Description</Label>
                <Textarea
                  id="course_description"
                  value={formData.course_description}
                  onChange={(e) => handleInputChange('course_description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course_type">Course Type</Label>
                  <Input
                    id="course_type"
                    value={formData.course_type}
                    onChange={(e) => handleInputChange('course_type', e.target.value)}
                    placeholder="e.g., Technical, Soft Skills"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select 
                    value={formData.difficulty_level} 
                    onValueChange={(value) => handleInputChange('difficulty_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_role">Target Role</Label>
                <Input
                  id="target_role"
                  value={formData.target_role}
                  onChange={(e) => handleInputChange('target_role', e.target.value)}
                  placeholder="e.g., Developer, Manager"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learning_objectives">Learning Objectives</Label>
                <Textarea
                  id="learning_objectives"
                  value={formData.learning_objectives}
                  onChange={(e) => handleInputChange('learning_objectives', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_mandatory"
                    checked={formData.is_mandatory}
                    onCheckedChange={(checked) => handleInputChange('is_mandatory', checked)}
                  />
                  <Label htmlFor="is_mandatory">Mandatory Course</Label>
                </div>

                <div className="space-y-2">
                  <Label>Completion Rule</Label>
                  <Select 
                    value={formData.completion_rule} 
                    onValueChange={(value) => handleInputChange('completion_rule', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass_all_assessments">Pass All Assessments</SelectItem>
                      <SelectItem value="pass_minimum_percentage">Pass Minimum Percentage</SelectItem>
                      <SelectItem value="pass_mandatory_only">Pass Mandatory Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.completion_rule === 'pass_minimum_percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="minimum_passing_percentage">Minimum Passing Percentage</Label>
                    <Input
                      id="minimum_passing_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.minimum_passing_percentage}
                      onChange={(e) => handleInputChange('minimum_passing_percentage', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate('/courses')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Create Course
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}