import { X } from "lucide-react";
import { providerScheme } from "../../lib/providerDisplay";
import { useAppStore } from "../../store/appStore";
import { useConnectionStore } from "../../store/connectionStore";
import { useUiStore, type DetailTab } from "../../store/uiStore";
import { MetadataTab } from "./MetadataTab";
import { PreviewTab } from "./PreviewTab";
import { VersionsTab } from "./VersionsTab";

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "metadata", label: "Metadata" },
  { id: "preview", label: "Preview" },
  { id: "versions", label: "Versions" },
];

export function DetailPanel() {
  const open = useUiStore((s) => s.detailPanelOpen);
  const selectedObject = useUiStore((s) => s.selectedObject);
  const detailTab = useUiStore((s) => s.detailTab);
  const setDetailTab = useUiStore((s) => s.setDetailTab);
  const closeDetail = useUiStore((s) => s.closeDetail);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);

  if (!open || !selectedObject || !currentBucket) return null;

  const scheme = profile ? providerScheme(profile.type) : "s3";

  return (
    <aside className="w-80 shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Object Inspector
          </span>
          <button
            type="button"
            onClick={closeDetail}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        </div>
        <p className="font-mono text-xs text-[var(--text-primary)] break-all">
          {selectedObject.key}
        </p>
        <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1">
          {scheme}://{currentBucket}/{selectedObject.key}
        </p>
      </div>
      <div className="flex border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`flex-1 px-2 py-2.5 text-[10px] uppercase tracking-wider font-semibold ${
              detailTab === t.id
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            onClick={() => setDetailTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {detailTab === "metadata" && (
          <MetadataTab object={selectedObject} bucket={currentBucket} />
        )}
        {detailTab === "preview" && (
          <PreviewTab object={selectedObject} bucket={currentBucket} />
        )}
        {detailTab === "versions" && (
          <VersionsTab bucket={currentBucket} objectKey={selectedObject.key} />
        )}
      </div>
    </aside>
  );
}
