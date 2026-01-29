import { UrlLinkTool } from "../components/tools/UrlLinkTool";
import { ComingSoon } from "../components/ComingSoon";

interface HomeProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  selectedAppId: string;
  settings: any;
  onSelectApp: (id: string) => void;
}

export function Home({ activeTool, setActiveTool, selectedAppId, settings, onSelectApp }: HomeProps) {
  return (
    <div className="space-y-6">
      {/* Active Tool Panel */}
      {activeTool === "urllink" && (
        <UrlLinkTool
          selectedAppId={selectedAppId}
          settings={settings}
          onSelectApp={onSelectApp}
        />
      )}

      {/* Coming Soon Tool */}
      {activeTool !== "urllink" && <ComingSoon />}
    </div>
  );
}
