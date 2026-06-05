import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, File, Folder, FolderOpen } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { useConnectionStore } from "../../store/connectionStore";
import { useModalStore } from "../../store/modalStore";
import { useSelectionStore } from "../../store/selectionStore";
import { useToast } from "../../hooks/useToast";
import { formatBytes } from "../../lib/formatBytes";
import {
  buildDestinationKey,
  transferObjects,
} from "../../lib/transferService";
import { Modal } from "../shared/Modal";
import type { Bucket } from "../../api/types";

export function CopyMoveModal() {
  const active = useModalStore((s) => s.active.copyMove);
  const closeModal = useModalStore((s) => s.closeModal);
  const payload = typeof active === "object" ? active : undefined;
  const getActiveProvider = useConnectionStore((s) => s.getActiveProvider);
  const getProviderForProfile = useConnectionStore(
    (s) => s.getProviderForProfile,
  );
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const invalidateObjects = useAppStore((s) => s.invalidateObjects);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const toast = useToast();
  const [destProfileId, setDestProfileId] = useState(activeProfileId ?? "");
  const [destBuckets, setDestBuckets] = useState<Bucket[]>([]);
  const [destBucket, setDestBucket] = useState("");
  const [destPrefix, setDestPrefix] = useState("");
  const [preservePath, setPreservePath] = useState(true);
  const [operation, setOperation] = useState<"copy" | "move">(
    payload?.operation ?? "copy",
  );
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const destProfile = profiles.find((p) => p.id === destProfileId);
  const crossTarget = destProfileId !== activeProfileId;

  useEffect(() => {
    if (payload) {
      setOperation(payload.operation);
      setDestBucket(currentBucket ?? "");
      setDestProfileId(activeProfileId ?? profiles[0]?.id ?? "");
      setDestPrefix(currentPrefix);
    }
  }, [payload, currentBucket, currentPrefix, activeProfileId, profiles]);

  useEffect(() => {
    if (!destProfileId) {
      setDestBuckets([]);
      return;
    }
    const provider = getProviderForProfile(destProfileId);
    if (!provider) return;
    let cancelled = false;
    void provider
      .listBuckets()
      .then((list) => {
        if (!cancelled) setDestBuckets(list);
      })
      .catch(() => {
        if (!cancelled) setDestBuckets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [destProfileId, getProviderForProfile]);

  const totalSize = useMemo(
    () => payload?.sizes?.reduce((sum, n) => sum + n, 0) ?? 0,
    [payload?.sizes],
  );

  const run = async () => {
    const source = getActiveProvider();
    const destination = getProviderForProfile(destProfileId);
    if (
      !source ||
      !destination ||
      !currentBucket ||
      !destBucket ||
      !payload?.keys.length
    )
      return;

    setBusy(true);
    setProgress("");
    try {
      const planned = payload.keys.map((key) => ({
        key,
        dstKey: buildDestinationKey(key, destPrefix, preservePath),
      }));
      const samePlace = planned.filter(
        (p) => currentBucket === destBucket && p.key === p.dstKey,
      );
      if (samePlace.length) {
        toast.error("Destination matches source — choose a different bucket or path");
        return;
      }

      const sameBackend = !crossTarget && source.type === destination.type;

      if (sameBackend && operation === "copy") {
        for (const { key, dstKey } of planned) {
          await source.copyObject(
            { bucket: currentBucket, key },
            { bucket: destBucket, key: dstKey },
          );
        }
      } else if (sameBackend && operation === "move") {
        for (const { key, dstKey } of planned) {
          await source.moveObject(
            { bucket: currentBucket, key },
            { bucket: destBucket, key: dstKey },
          );
        }
      } else {
        const items = planned.map(({ key, dstKey }) => ({
          src: { bucket: currentBucket, key },
          dst: { bucket: destBucket, key: dstKey },
        }));
        await transferObjects(source, destination, items, (p) => {
          setProgress(`${p.completed + 1}/${p.total}`);
        });
        if (operation === "move") {
          for (const { key } of planned) {
            await source.deleteObject(currentBucket, key);
          }
        }
      }

      invalidateObjects();
      clearSelection();
      toast.success(
        `${operation === "copy" ? "Copied" : "Moved"} ${payload.keys.length} object(s)${
          crossTarget ? ` to ${destProfile?.name ?? "destination"}` : ""
        }`,
      );
      closeModal("copyMove");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${operation} failed`);
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const firstKey = payload?.keys[0];
  const firstName = firstKey?.split("/").pop() ?? "";
  const previewKey =
    firstKey && destBucket
      ? buildDestinationKey(firstKey, destPrefix, preservePath)
      : "";
  const pathParts = previewKey.split("/").filter(Boolean).slice(0, -1);

  return (
    <Modal
      isOpen={Boolean(active)}
      onClose={() => closeModal("copyMove")}
      title="Copy / Move Objects"
      size="xl"
      headerIcon={
        <ArrowRightLeft size={18} className="text-[var(--accent-copy)]" />
      }
      footer={
        <>
          <button
            type="button"
            className="text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={() => closeModal("copyMove")}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!destBucket || busy}
            onClick={() => void run()}
            className="h-10 px-8 bg-[var(--accent-copy)] text-black text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
          >
            {busy
              ? progress || "Working…"
              : operation === "copy"
                ? "Confirm Copy"
                : "Confirm Move"}
          </button>
        </>
      }
    >
      <div className="flex justify-end mb-4">
        <div className="inline-flex border border-[var(--border)] p-0.5 bg-[var(--bg-base)]">
          {(["copy", "move"] as const).map((op) => (
            <button
              key={op}
              type="button"
              className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                operation === op
                  ? "bg-[var(--accent-copy)] text-black"
                  : "text-[var(--accent-copy)] hover:bg-[var(--accent-copy)]/10"
              }`}
              onClick={() => setOperation(op)}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Selected Objects
          </p>
          {firstKey && (
            <div className="flex items-center justify-between p-3 bg-[var(--bg-base)] border border-[var(--border)]">
              <div className="flex items-center gap-2 min-w-0">
                <File size={14} className="text-[var(--accent)] shrink-0" />
                <span className="font-mono text-xs truncate">{firstName}</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] px-2 py-0.5 border border-[var(--border)]">
                {payload?.keys.length === 1 && totalSize > 0
                  ? formatBytes(totalSize)
                  : `${payload?.keys.length} files`}
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Destination
          </p>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">
            Connection profile
          </label>
          <select
            className="w-full h-10 px-3 mb-3 font-mono text-sm bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
            value={destProfileId}
            onChange={(e) => {
              setDestProfileId(e.target.value);
              setDestBucket("");
            }}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type.toUpperCase()})
                {p.id === activeProfileId ? " · current" : ""}
              </option>
            ))}
          </select>
          {crossTarget && (
            <p className="text-[10px] text-[var(--warning)] mb-3">
              Cross-provider transfer streams objects through the browser (get →
              upload).
            </p>
          )}
          <label className="text-xs text-[var(--text-muted)] mb-1 block">
            Bucket
          </label>
          <select
            className="w-full h-10 px-3 mb-3 font-mono text-sm bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)]"
            value={destBucket}
            onChange={(e) => setDestBucket(e.target.value)}
          >
            <option value="">Select bucket</option>
            {destBuckets.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">
            Path prefix
          </label>
          <div className="flex items-center h-10 px-3 border border-[var(--border)] bg-[var(--bg-base)]">
            <FolderOpen
              size={14}
              className="text-[var(--text-muted)] mr-2 shrink-0"
            />
            <input
              type="text"
              value={destPrefix}
              onChange={(e) => setDestPrefix(e.target.value)}
              placeholder="optional/prefix/"
              className="flex-1 bg-transparent font-mono text-sm outline-none"
            />
          </div>
          <label className="flex items-center gap-2 mt-3 text-xs text-[var(--text-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={preservePath}
              onChange={(e) => setPreservePath(e.target.checked)}
            />
            Preserve full object path (uncheck to use filename only)
          </label>
        </div>

        {previewKey && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Destination Preview
            </p>
            <div className="p-4 bg-[var(--bg-base)] border border-[var(--border)] font-mono text-xs flex flex-col gap-1">
              <p className="text-[var(--text-muted)] mb-1">
                {destProfile?.type.toUpperCase()}://{destBucket}/
              </p>
              {pathParts.map((part, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2"
                  style={{ paddingLeft: i * 12 + 8 }}
                >
                  <Folder size={12} className="text-[var(--text-muted)]" />
                  <span className="text-[var(--text-muted)]">{part}</span>
                </div>
              ))}
              <div
                className="flex items-center gap-2"
                style={{ paddingLeft: pathParts.length * 12 + 8 }}
              >
                <File size={12} className="text-[var(--success)]" />
                <span className="text-[var(--success)]">
                  {previewKey.split("/").pop()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
