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
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'document':
      case 'pdf':
        return <Download className="w-4 h-4" />;
      case 'link':
      case 'url':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return 'bg-error/10 text-error border-error/20';
      case 'document':
      case 'pdf':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'link':
      case 'url':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">
            Module {order}
          </Badge>
          <Badge variant="outline" className={getContentTypeColor(contentType)}>
            <span className="mr-1">{getContentIcon(contentType)}</span>
            {contentType}
          </Badge>
        </div>
        
        <CardTitle className="text-lg font-semibold leading-tight">
          {name}
        </CardTitle>
        
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Module Meta */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {estimatedDuration && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{estimatedDuration} min</span>
            </div>
          )}
          
          {(contentUrl || contentPath) && (
            <div className="flex items-center text-primary">
              <span className="text-xs">Content available</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewContent?.(id)}
          >
            View Content
          </Button>
          
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