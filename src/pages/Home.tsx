import { UrlLinkTool } from "../components/tools/UrlLinkTool";
import { ComingSoon } from "../components/ComingSoon";

interface UrlLinkResult {
  path: string;
  query: string;
  link: string;
  err_msg: string;
}

interface HomeProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  selectedAppId: string;
  settings: any;
  onSelectApp: (id: string) => void;
  urlLinkResults: UrlLinkResult[];
  setUrlLinkResults: (results: UrlLinkResult[]) => void;
}

export function Home({ activeTool, selectedAppId, settings, onSelectApp, urlLinkResults, setUrlLinkResults }: HomeProps) {
  return (
    <div className="space-y-6">
      {/* Active Tool Panel */}
      {activeTool === "urllink" && (
        <UrlLinkTool
          selectedAppId={selectedAppId}
          settings={settings}
          onSelectApp={onSelectApp}
          urlLinkResults={urlLinkResults}
          setUrlLinkResults={setUrlLinkResults}
        />
      )}

      {/* Coming Soon Tool */}
      {activeTool !== "urllink" && <ComingSoon />}
    </div>
  );
}
