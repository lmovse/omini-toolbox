export function ComingSoon() {
  return (
    <div className="bento-card">
      <div className="bento-card-content text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h3 className="text-lg font-medium mb-2">即将推出</h3>
        <p className="text-muted-foreground">
          这个工具正在开发中，敬请期待...
        </p>
      </div>
    </div>
  );
}
