import {
  Link,
  QrCode,
  Hash,
  Clock,
} from "lucide-react";

interface ToolCardProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  comingSoon: boolean;
  isActive: boolean;
  onClick: () => void;
}

export function ToolCard({ name, icon, color, comingSoon, isActive, onClick }: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={comingSoon}
      className={`bento-card tool-card text-left ${isActive ? "ring-2 ring-primary" : ""}`}
    >
      <div className="bento-card-header">
        <div className={`tool-icon ${color}`}>
          {icon}
        </div>
        <div>
          <h3 className="bento-card-title">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {comingSoon ? "即将推出" : "可用"}
          </p>
        </div>
      </div>
      <div className="bento-card-content">
        <p className="text-sm text-muted-foreground">
          {comingSoon
            ? "这个工具正在开发中，敬请期待..."
            : "点击开始使用此工具"}
        </p>
      </div>
    </button>
  );
}

export const tools = [
  {
    id: "urllink",
    name: "URL Link",
    icon: <Link className="w-5 h-5" />,
    color: "bg-green-500/10 text-green-600",
    comingSoon: false,
  },
  {
    id: "qrcode",
    name: "二维码",
    icon: <QrCode className="w-5 h-5" />,
    color: "bg-blue-500/10 text-blue-600",
    comingSoon: true,
  },
  {
    id: "url-encoder",
    name: "URL 编码",
    icon: <Hash className="w-5 h-5" />,
    color: "bg-purple-500/10 text-purple-600",
    comingSoon: true,
  },
  {
    id: "timestamp",
    name: "时间戳",
    icon: <Clock className="w-5 h-5" />,
    color: "bg-orange-500/10 text-orange-600",
    comingSoon: true,
  },
];
