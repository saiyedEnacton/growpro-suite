import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainNav } from '@/components/navigation/MainNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, FileText, Video, Link as LinkIcon, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function ModuleViewer() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && moduleId && profile?.id) {
      fetchModuleData();
    }
  }, [courseId, moduleId, profile?.id]);

  const fetchModuleData = async () => {
    try {
      // Fetch module details
      const { data: moduleData, error: moduleError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('id', moduleId)
        .eq('course_id', courseId)
        .single();

      if (moduleError) throw moduleError;

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('course_name')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      setModule(moduleData);
      setCourse(courseData);
    } catch (error) {
      console.error('Error fetching module data:', error);
      toast({
        title: "Error",
        description: "Failed to load module content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
      case 'video':
        return Video;
      case 'document':
      case 'pdf':
        return FileText;
      case 'link':
      case 'url':
        return LinkIcon;
      default:
        return FileText;
    }
  };

  const renderContent = () => {
    if (!module) return null;

    const { content_type, content_url, content_path } = module;
    
    switch (content_type?.toLowerCase()) {
      case 'video':
        if (content_url) {
          return (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={content_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        break;
      
      case 'document':
      case 'pdf':
        if (content_url) {
          return (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Document content</p>
                  <Button asChild>
                    <a href={content_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download Document
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        break;
      
      case 'link':
      case 'url':
        if (content_url) {
          return (
            <div className="space-y-4">
              <div className="p-6 bg-muted rounded-lg text-center">
                <LinkIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">External Resource</p>
                <Button asChild>
                  <a href={content_url} target="_blank" rel="noopener noreferrer">
                    Open Link
                    <LinkIcon className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          );
        }
        break;
      
      case 'text':
      default:
        return (
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="bg-muted/30 p-6 rounded-lg">
              <p className="text-muted-foreground">
                {content_path || 'No content available for this module.'}
              </p>
            </div>
          </div>
        );
    }

    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Content not available</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!module || !course) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(`/courses/${courseId}`)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Module not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const ContentIcon = getContentIcon(module.content_type);

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(`/courses/${courseId}`)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {course.course_name}
        </Button>

        {/* Module Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{module.module_name}</CardTitle>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">
                    Module {module.module_order}
                  </Badge>
                  <Badge variant="secondary">
                    <ContentIcon className="h-3 w-3 mr-1" />
                    {module.content_type}
                  </Badge>
                  {module.estimated_duration_minutes && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {module.estimated_duration_minutes} min
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {module.module_description && (
              <p className="text-muted-foreground mb-6">{module.module_description}</p>
            )}
          </CardContent>
        </Card>

        {/* Module Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ContentIcon className="h-5 w-5 mr-2" />
              Module Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}