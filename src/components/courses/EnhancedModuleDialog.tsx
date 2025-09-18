import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Link, Upload } from 'lucide-react';

interface ModuleLink {
  id: string;
  name: string;
  url: string;
}

interface ModuleFile {
  id: string;
  name: string;
  type: string;
  url: string;
  path: string;
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
  module_links?: ModuleLink[];
  module_files?: ModuleFile[];
}

interface EnhancedModuleDialogProps {
  courseId: string;
  module: Module | null;
  moduleOrder: number;
  onSave: (module: Module) => void;
  onClose: () => void;
}

export function EnhancedModuleDialog({ courseId, module, moduleOrder, onSave, onClose }: EnhancedModuleDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    module_name: '',
    module_description: '',
    content_type: 'text',
    content_url: '',
    content_path: '',
    estimated_duration_minutes: 60
  });

  const [links, setLinks] = useState<ModuleLink[]>([]);
  const [files, setFiles] = useState<ModuleFile[]>([]);

  useEffect(() => {
    if (module) {
      setForm({
        module_name: module.module_name,
        module_description: module.module_description || '',
        content_type: module.content_type || 'text',
        content_url: module.content_url || '',
        content_path: module.content_path || '',
        estimated_duration_minutes: module.estimated_duration_minutes || 60
      });
      setLinks(module.module_links || []);
      setFiles(module.module_files || []);
    }
  }, [module]);

  const addLink = () => {
    const newLink: ModuleLink = {
      id: crypto.randomUUID(),
      name: '',
      url: ''
    };
    setLinks([...links, newLink]);
  };

  const updateLink = (index: number, field: keyof ModuleLink, value: string) => {
    const updatedLinks = links.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    );
    setLinks(updatedLinks);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const addFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.mp4,.mov,.avi,.wmv';
    input.multiple = true;
    input.onchange = (e) => {
      const selectedFiles = Array.from((e.target as HTMLInputElement).files || []);
      const newFiles: ModuleFile[] = selectedFiles.map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        path: file.name // This would be replaced with actual storage path after upload
      }));
      setFiles([...files, ...newFiles]);
    };
    input.click();
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || !form.module_name.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const moduleData = {
        ...form,
        course_id: courseId,
        module_order: module ? module.module_order : moduleOrder,
        // Store links and files as JSON in content_url and content_path for now
        // In a production app, you'd want separate tables for these
        content_url: JSON.stringify({ 
          url: form.content_url, 
          links: links.filter(link => link.name && link.url) 
        }),
        content_path: JSON.stringify({ 
          path: form.content_path, 
          files: files 
        })
      };

      let result;
      if (module) {
        // Update existing module
        const { data, error } = await supabase
          .from('course_modules')
          .update(moduleData)
          .eq('id', module.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new module
        const { data, error } = await supabase
          .from('course_modules')
          .insert(moduleData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      toast({
        title: "Success",
        description: `Module ${module ? 'updated' : 'created'} successfully.`,
      });

      onSave(result);
      onClose();

    } catch (error: any) {
      console.error('Error saving module:', error);
      toast({
        title: "Error",
        description: `Failed to ${module ? 'update' : 'create'} module. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="links">Links</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4 mt-6">
        <div>
          <Label htmlFor="module_name">Module Name *</Label>
          <Input
            id="module_name"
            value={form.module_name}
            onChange={(e) => setForm({ ...form, module_name: e.target.value })}
            placeholder="e.g., Introduction to React"
          />
        </div>

        <div>
          <Label htmlFor="module_description">Description</Label>
          <Textarea
            id="module_description"
            value={form.module_description}
            onChange={(e) => setForm({ ...form, module_description: e.target.value })}
            placeholder="Brief description of the module"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="content_type">Content Type</Label>
            <Select
              value={form.content_type}
              onValueChange={(value) => setForm({ ...form, content_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="mixed">Mixed Content</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estimated_duration">Duration (minutes)</Label>
            <Input
              id="estimated_duration"
              type="number"
              min="1"
              value={form.estimated_duration_minutes}
              onChange={(e) => setForm({ ...form, estimated_duration_minutes: parseInt(e.target.value) || 60 })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="content_url">Primary Content URL</Label>
          <Input
            id="content_url"
            value={form.content_url}
            onChange={(e) => setForm({ ...form, content_url: e.target.value })}
            placeholder="Main URL to content (video, document, etc.)"
          />
        </div>
      </TabsContent>

      <TabsContent value="links" className="space-y-4 mt-6">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium">Additional Links</Label>
          <Button onClick={addLink} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        {links.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No additional links added</p>
              <p className="text-sm">Add links to external resources, videos, or documents.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {links.map((link, index) => (
              <Card key={link.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-sm">Link Name</Label>
                      <Input
                        value={link.name}
                        onChange={(e) => updateLink(index, 'name', e.target.value)}
                        placeholder="e.g., React Documentation"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm">URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="files" className="space-y-4 mt-6">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium">Module Files</Label>
          <Button onClick={addFile} size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>

        {files.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No files uploaded</p>
              <p className="text-sm">Upload PDFs, videos, or other learning materials.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {files.map((file, index) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-muted rounded">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{file.type}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : module ? 'Update Module' : 'Add Module'}
        </Button>
      </div>
    </Tabs>
  );
}