import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Video, Link as LinkIcon, Download } from 'lucide-react';

interface CourseModuleProps {
  id: string;
  name: string;
  description?: string;
  order: number;
  contentType?: string;
  contentUrl?: string;
  contentPath?: string;
  estimatedDuration?: number;
  onStartModule?: (moduleId: string) => void;
  onViewContent?: (moduleId: string) => void;
}

export const CourseModule = ({
  id,
  name,
  description,
  order,
  contentType = 'text',
  contentUrl,
  contentPath,
  estimatedDuration,
  onStartModule,
  onViewContent,
}: CourseModuleProps) => {
  const getContentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'document':
      case 'pdf': return <Download className="w-4 h-4" />;
      case 'link':
      case 'url':
      case 'mixed': return <LinkIcon className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">Module {order}</Badge>
          {estimatedDuration && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              <span>{estimatedDuration} min</span>
            </div>
          )}
        </div>
        <CardTitle className="text-lg font-semibold leading-tight">{name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
        )}

        <div className="space-y-3 pt-2">
          {contentUrl && (() => {
            try {
              const parsed = JSON.parse(contentUrl);
              return (
                <>
                  {parsed.url && (
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="w-4 h-4 text-primary" />
                      <a href={parsed.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">
                        Primary Content
                      </a>
                    </div>
                  )}
                  {parsed.links && parsed.links.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Additional Resources:</h4>
                      <div className="space-y-1 pl-2">
                        {parsed.links.map((link: any, i: number) => (
                          <div key={i} className="flex items-center space-x-2">
                            <LinkIcon className="w-3 h-3 text-muted-foreground" />
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                              {link.name || 'Resource'}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            } catch {
              return (
                <div className="flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  <a href={contentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">
                    View Content
                  </a>
                </div>
              );
            }
          })()}

          {contentPath && (() => {
            try {
              const parsed = JSON.parse(contentPath);
              return parsed.files && parsed.files.length > 0 ? (
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Downloads:</h4>
                  <div className="space-y-1 pl-2">
                    {parsed.files.map((file: any, i: number) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Download className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            } catch {
              return contentPath ? (
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{contentPath}</span>
                </div>
              ) : null;
            }
          })()}
        </div>

        <div className="flex space-x-2 pt-2 border-t">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onStartModule?.(id)}
          >
            Start Module
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};