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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ModuleDialog } from '@/components/courses/ModuleDialog';
import { AssessmentDialog } from '@/components/courses/AssessmentDialog';

export default function CreateCourse() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [modules, setModules] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  
  // Dialog states
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  
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

      setCurrentCourseId(data.id);
      
      toast({
        title: "Success",
        description: "Course created successfully. Now you can add modules and assessments."
      });
      
      // Switch to modules tab after course creation
      setActiveTab('modules');
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

  const handleAddModule = () => {
    setEditingModule(null);
    setShowModuleDialog(true);
  };

  const handleEditModule = (module: any) => {
    setEditingModule(module);
    setShowModuleDialog(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!currentCourseId) return;
    
    try {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      setModules(prev => prev.filter(m => m.id !== moduleId));
      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive",
      });
    }
  };

  const handleModuleSave = (module: any) => {
    if (editingModule) {
      setModules(prev => prev.map(m => m.id === module.id ? module : m));
    } else {
      setModules(prev => [...prev, module]);
    }
  };

  const handleAddAssessment = () => {
    setEditingAssessment(null);
    setShowAssessmentDialog(true);
  };

  const handleEditAssessment = (assessment: any) => {
    setEditingAssessment(assessment);
    setShowAssessmentDialog(true);
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!currentCourseId) return;
    
    try {
      const { error } = await supabase
        .from('assessment_templates')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;

      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
      toast({
        title: "Success",
        description: "Assessment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete assessment",
        variant: "destructive",
      });
    }
  };

  const handleFinishCourse = () => {
    navigate(`/courses/${currentCourseId}`);
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Course Details</TabsTrigger>
                <TabsTrigger value="modules" disabled={!currentCourseId}>
                  Modules {currentCourseId ? '' : '(Save first)'}
                </TabsTrigger>
                <TabsTrigger value="assessments" disabled={!currentCourseId}>
                  Assessments {currentCourseId ? '' : '(Save first)'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
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
                      {currentCourseId ? 'Update Course' : 'Create Course'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="modules" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Course Modules</h3>
                  <Button onClick={handleAddModule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </div>

                <div className="space-y-4">
                  {modules.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No modules added yet. Click "Add Module" to get started.
                    </p>
                  ) : (
                    modules.map((module, index) => (
                      <Card key={module.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{module.module_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {module.module_description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                <span>Order: {module.module_order}</span>
                                <span>Type: {module.content_type}</span>
                                <span>Duration: {module.estimated_duration_minutes}min</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditModule(module)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteModule(module.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleFinishCourse}>
                    Continue to Course
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="assessments" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Course Assessments</h3>
                  <Button onClick={handleAddAssessment}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assessment
                  </Button>
                </div>

                <div className="space-y-4">
                  {assessments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No assessments added yet. Click "Add Assessment" to get started.
                    </p>
                  ) : (
                    assessments.map((assessment) => (
                      <Card key={assessment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{assessment.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {assessment.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                <span>Type: {assessment.assessment_type}</span>
                                <span>Passing: {assessment.passing_score}%</span>
                                <span>Time: {assessment.time_limit_minutes}min</span>
                                {assessment.is_mandatory && <span className="text-destructive">Mandatory</span>}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAssessment(assessment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAssessment(assessment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleFinishCourse}>
                    Finish & View Course
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingModule ? 'Edit Module' : 'Add New Module'}
              </DialogTitle>
            </DialogHeader>
            {currentCourseId && (
              <ModuleDialog
                courseId={currentCourseId}
                module={editingModule}
                moduleOrder={modules.length + 1}
                onSave={handleModuleSave}
                onClose={() => setShowModuleDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAssessment ? 'Edit Assessment' : 'Add New Assessment'}
              </DialogTitle>
            </DialogHeader>
            {currentCourseId && (
              <AssessmentDialog
                courseId={currentCourseId}
                assessment={editingAssessment}
                onClose={() => setShowAssessmentDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}