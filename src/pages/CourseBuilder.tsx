import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MainNav } from '@/components/navigation/MainNav';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  FileText, 
  Video, 
  Link as LinkIcon,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Course {
  id: string;
  course_name: string;
  course_description: string;
  difficulty_level: string;
  course_type: string;
  is_mandatory: boolean;
  completion_rule: string;
  minimum_passing_percentage: number;
  learning_objectives: string;
}

interface Module {
  id: string;
  course_id: string;
  module_name: string;
  module_description: string;
  module_order: number;
  content_type: string;
  content_url: string;
  content_path: string;
  estimated_duration_minutes: number;
}

interface Assessment {
  id: string;
  course_id: string;
  employee_id: string;
  assessment_type: string;
  passing_score: number;
  is_mandatory: boolean;
  status: string;
}

export default function CourseBuilder() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);

  // Form states
  const [moduleForm, setModuleForm] = useState({
    module_name: '',
    module_description: '',
    content_type: 'text',
    content_url: '',
    content_path: '',
    estimated_duration_minutes: 60
  });

  const [assessmentForm, setAssessmentForm] = useState({
    assessment_type: 'Module Assessment',
    passing_score: 70,
    is_mandatory: true
  });

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Check permissions - using Supabase function to get user role
  const canManageCourses = async () => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.rpc('get_user_role', { user_id: user.id });
      if (error) throw error;
      return ['Team Lead', 'HR', 'Management'].includes(data);
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  };

  const [hasManagePermission, setHasManagePermission] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const canManage = await canManageCourses();
      setHasManagePermission(canManage);
    };
    checkPermissions();
  }, [user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order');

      if (modulesError) throw modulesError;

      // Fetch assessments (simplified view)
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('course_assessments')
        .select('*')
        .eq('course_id', courseId)
        .limit(10);

      if (assessmentsError && assessmentsError.code !== 'PGRST116') {
        throw assessmentsError;
      }

      setCourse(courseData);
      setModules(modulesData || []);
      setAssessments(assessmentsData || []);

    } catch (error: any) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async (updatedCourse: Partial<Course>) => {
    if (!course) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('courses')
        .update(updatedCourse)
        .eq('id', course.id);

      if (error) throw error;

      setCourse({ ...course, ...updatedCourse });
      toast({
        title: "Success",
        description: "Course updated successfully.",
      });

    } catch (error: any) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModule = async () => {
    if (!courseId) return;

    try {
      setSaving(true);
      const moduleData = {
        ...moduleForm,
        course_id: courseId,
        module_order: editingModule ? editingModule.module_order : modules.length + 1
      };

      if (editingModule) {
        const { error } = await supabase
          .from('course_modules')
          .update(moduleData)
          .eq('id', editingModule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('course_modules')
          .insert(moduleData);

        if (error) throw error;
      }

      await fetchCourseData();
      setModuleDialogOpen(false);
      setEditingModule(null);
      setModuleForm({
        module_name: '',
        module_description: '',
        content_type: 'text',
        content_url: '',
        content_path: '',
        estimated_duration_minutes: 60
      });

      toast({
        title: "Success",
        description: `Module ${editingModule ? 'updated' : 'created'} successfully.`,
      });

    } catch (error: any) {
      console.error('Error saving module:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingModule ? 'update' : 'create'} module. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      await fetchCourseData();
      toast({
        title: "Success",
        description: "Module deleted successfully.",
      });

    } catch (error: any) {
      console.error('Error deleting module:', error);
      toast({
        title: "Error",
        description: "Failed to delete module. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'document':
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'link':
      case 'url':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <div className="container mx-auto py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!hasManagePermission) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">You don't have permission to manage courses.</p>
              <Button onClick={() => navigate('/courses')} className="mt-4">
                Back to Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Course not found</p>
              <Button onClick={() => navigate('/courses')} className="mt-4">
                Back to Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/courses')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Course Builder</h1>
              <p className="text-muted-foreground">{course.course_name}</p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate(`/courses/${courseId}`)}
            variant="outline"
          >
            Preview Course
          </Button>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Course Details</TabsTrigger>
            <TabsTrigger value="modules">Modules ({modules.length})</TabsTrigger>
            <TabsTrigger value="assessments">Assessments ({assessments.length})</TabsTrigger>
          </TabsList>

          {/* Course Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course_name">Course Name</Label>
                    <Input
                      id="course_name"
                      value={course.course_name}
                      onChange={(e) => setCourse({...course, course_name: e.target.value})}
                      onBlur={() => handleSaveCourse({course_name: course.course_name})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="difficulty_level">Difficulty Level</Label>
                    <Select
                      value={course.difficulty_level}
                      onValueChange={(value) => {
                        setCourse({...course, difficulty_level: value});
                        handleSaveCourse({difficulty_level: value});
                      }}
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

                <div>
                  <Label htmlFor="course_description">Description</Label>
                  <Textarea
                    id="course_description"
                    value={course.course_description || ''}
                    onChange={(e) => setCourse({...course, course_description: e.target.value})}
                    onBlur={() => handleSaveCourse({course_description: course.course_description})}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="learning_objectives">Learning Objectives</Label>
                  <Textarea
                    id="learning_objectives"
                    value={course.learning_objectives || ''}
                    onChange={(e) => setCourse({...course, learning_objectives: e.target.value})}
                    onBlur={() => handleSaveCourse({learning_objectives: course.learning_objectives})}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_mandatory"
                    checked={course.is_mandatory}
                    onCheckedChange={(checked) => {
                      setCourse({...course, is_mandatory: checked});
                      handleSaveCourse({is_mandatory: checked});
                    }}
                  />
                  <Label htmlFor="is_mandatory">Mandatory Course</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Course Modules</h3>
              <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingModule(null);
                    setModuleForm({
                      module_name: '',
                      module_description: '',
                      content_type: 'text',
                      content_url: '',
                      content_path: '',
                      estimated_duration_minutes: 60
                    });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Module
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingModule ? 'Edit Module' : 'Add New Module'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="module_name">Module Name</Label>
                      <Input
                        id="module_name"
                        value={moduleForm.module_name}
                        onChange={(e) => setModuleForm({...moduleForm, module_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="module_description">Description</Label>
                      <Textarea
                        id="module_description"
                        value={moduleForm.module_description}
                        onChange={(e) => setModuleForm({...moduleForm, module_description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="content_type">Content Type</Label>
                        <Select
                          value={moduleForm.content_type}
                          onValueChange={(value) => setModuleForm({...moduleForm, content_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                            <SelectItem value="link">External Link</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="estimated_duration">Duration (minutes)</Label>
                        <Input
                          id="estimated_duration"
                          type="number"
                          value={moduleForm.estimated_duration_minutes}
                          onChange={(e) => setModuleForm({...moduleForm, estimated_duration_minutes: parseInt(e.target.value) || 60})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="content_url">Content URL</Label>
                      <Input
                        id="content_url"
                        value={moduleForm.content_url}
                        onChange={(e) => setModuleForm({...moduleForm, content_url: e.target.value})}
                        placeholder="https://example.com/video or file path"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveModule} disabled={saving}>
                        {saving ? 'Saving...' : editingModule ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {modules.map((module, index) => (
                <Card key={module.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <Badge variant="outline">Module {module.module_order}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getContentIcon(module.content_type)}
                          <div>
                            <h4 className="font-medium">{module.module_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {module.content_type} • {module.estimated_duration_minutes} min
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingModule(module);
                            setModuleForm({
                              module_name: module.module_name,
                              module_description: module.module_description || '',
                              content_type: module.content_type,
                              content_url: module.content_url || '',
                              content_path: module.content_path || '',
                              estimated_duration_minutes: module.estimated_duration_minutes
                            });
                            setModuleDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteModule(module.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Course Assessments</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Assessment
              </Button>
            </div>

            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Assessment management coming soon</p>
                <p className="text-sm">For now, assessments are created automatically when students take them.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}