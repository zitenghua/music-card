export default function ConfigActions({ onReset, onExport, onImport, onExportPng }) {
  return (
    <div className="config-actions">
      <div className="config-actions-row">
        <button className="btn-action btn-import" onClick={onImport}>导入配置</button>
        <button className="btn-action btn-export" onClick={onExport}>导出配置</button>
      </div>
      <div className="config-actions-row">
        <button className="btn-action btn-reset" onClick={onReset}>重置</button>
        <button className="btn-action btn-png" onClick={onExportPng}>导出 PNG</button>
      </div>
    </div>
  )
}
