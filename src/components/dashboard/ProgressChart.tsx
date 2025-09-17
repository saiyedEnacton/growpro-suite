import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProgressItem {
  label: string;
  value: number;
  total: number;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

interface ProgressChartProps {
  title: string;
  data: ProgressItem[];
  className?: string;
}

export const ProgressChart = ({ title, data, className = '' }: ProgressChartProps) => {
  const getProgressColor = (color: ProgressItem['color']) => {
    const colorMap = {
      primary: 'bg-primary',
      secondary: 'bg-secondary', 
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error'
    };
    return colorMap[color];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item, index) => {
          const percentage = Math.round((item.value / item.total) * 100);
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.value}/{item.total} ({percentage}%)
                </span>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};