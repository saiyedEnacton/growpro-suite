import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Link, Upload, File as FileIcon } from 'lucide-react';

// Interfaces would ideally be in a separate types file
interface ModuleLink { id: string; name: string; url: string; }
interface ModuleFile { id: string; name: string; type: string; url: string; path: string; }
interface Module {
  id: string; course_id: string; module_name: string; module_description: string;
  module_order: number; content_type: string; content_url: string; content_path: string;
  estimated_duration_minutes: number; module_links?: ModuleLink[]; module_files?: ModuleFile[];
}

interface EnhancedModuleDialogProps {
  courseId: string; module: Module | null; moduleOrder: number;
  onSave: (module: Module) => void; onClose: () => void;
}

export function EnhancedModuleDialog({ courseId, module, moduleOrder, onSave, onClose }: EnhancedModuleDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    module_name: '', module_description: '', content_type: 'mixed',
    content_url: '', content_path: '', estimated_duration_minutes: 60
  });

  const [links, setLinks] = useState<Omit<ModuleLink, 'id'>[]>([]);
  const [files, setFiles] = useState<ModuleFile[]>([]);

  useEffect(() => {
    if (module) {
      setForm({
        module_name: module.module_name, module_description: module.module_description || '',
        content_type: 'mixed', estimated_duration_minutes: module.estimated_duration_minutes || 60,
        content_url: '', content_path: ''
      });
      if (module.content_url) {
        try {
          const { url, links } = JSON.parse(module.content_url);
          setForm(prev => ({ ...prev, content_url: url || '' }));
          setLinks(links || []);
        } catch { setForm(prev => ({ ...prev, content_url: module.content_url })); }
      }
      if (module.content_path) {
        try {
          const { files } = JSON.parse(module.content_path);
          setFiles(files || []);
        } catch { /* Gracefully handle non-JSON path */ }
      }
    }
  }, [module]);

  const addLink = () => setLinks([...links, { name: '', url: '' }]);
  const updateLink = (index: number, field: keyof Omit<ModuleLink, 'id'>, value: string) => {
    const updated = links.map((l, i) => i === index ? { ...l, [field]: value } : l);
    setLinks(updated);
  };
  const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!user || !form.module_name.trim()) {
      toast({ title: "Error", description: "Module Name is required.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const moduleData = {
        ...form,
        course_id: courseId,
        module_order: module ? module.module_order : moduleOrder,
        content_type: 'mixed',
        content_url: JSON.stringify({ url: form.content_url, links: links.filter(l => l.name && l.url) }),
        content_path: JSON.stringify({ files: files.map(f => ({ name: f.name, path: f.path })) })
      };
      const { data, error } = module
        ? await supabase.from('course_modules').update(moduleData).eq('id', module.id).select().single()
        : await supabase.from('course_modules').insert(moduleData).select().single();
      if (error) throw error;
      toast({ title: "Success", description: `Module ${module ? 'updated' : 'created'}.` });
      onSave(data);
      onClose();
    } catch (error: any) {
      console.error('Error saving module:', error);
      toast({ title: "Error", description: `Failed to save module.`, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2">
      {/* Left Column: Basic Info */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Module Details</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="module_name">Module Name *</Label>
            <Input id="module_name" value={form.module_name} onChange={e => setForm({ ...form, module_name: e.target.value })} placeholder="e.g., Introduction to React" />
          </div>
          <div>
            <Label htmlFor="module_description">Description</Label>
            <Textarea id="module_description" value={form.module_description} onChange={e => setForm({ ...form, module_description: e.target.value })} placeholder="A brief overview of the module..." rows={4} />
          </div>
          <div>
            <Label htmlFor="estimated_duration">Duration (minutes)</Label>
            <Input id="estimated_duration" type="number" min="1" value={form.estimated_duration_minutes} onChange={e => setForm({ ...form, estimated_duration_minutes: parseInt(e.target.value) || 60 })} />
          </div>
        </div>
      </div>

      {/* Right Column: Content */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Module Content</h2>
        <Card>
          <CardHeader><CardTitle className="text-base">Primary Content</CardTitle></CardHeader>
          <CardContent>
            <Label htmlFor="content_url">Primary URL (Video, Article, etc.)</Label>
            <Input id="content_url" value={form.content_url} onChange={e => setForm({ ...form, content_url: e.target.value })} placeholder="https://example.com/main-resource" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Additional Links</CardTitle>
              <Button onClick={addLink} size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No additional links.</p>
            ) : (links.map((link, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Name</Label>
                  <Input value={link.name} onChange={e => updateLink(index, 'name', e.target.value)} placeholder="e.g., React Docs" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">URL</Label>
                  <Input value={link.url} onChange={e => updateLink(index, 'url', e.target.value)} placeholder="https://..." />
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeLink(index)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            )))} 
          </CardContent>
        </Card>
      </div>

      {/* Footer Buttons */}
      <div className="md:col-span-2 flex justify-end space-x-2 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Module'}</Button>
      </div>
    </div>
  );
}